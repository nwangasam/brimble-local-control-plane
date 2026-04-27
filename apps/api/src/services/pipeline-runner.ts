import { setTimeout as delay } from "node:timers/promises";

import type { DeploymentPhase, DeploymentStatus } from "@brimble/contracts";

import type { DeploymentRepository } from "../domain/deployments/repository.js";
import type { DeploymentRow } from "../db/schema.js";
import { env } from "../lib/env.js";
import { CaddyService } from "./caddy-service.js";
import { DockerService } from "./docker-service.js";
import { DeploymentEventBus } from "./event-bus.js";
import { RailpackService } from "./railpack-service.js";
import { WorkspaceService } from "./workspace-service.js";

type QueueJob = { deploymentId: string };

export class PipelineRunner {
  private queue: QueueJob[] = [];
  private processing = false;
  private queuedIds = new Set<string>();

  constructor(
    private readonly repository: DeploymentRepository,
    private readonly eventBus: DeploymentEventBus,
    private readonly workspaceService: WorkspaceService,
    private readonly railpackService: RailpackService,
    private readonly dockerService: DockerService,
    private readonly caddyService: CaddyService
  ) {}

  enqueue(deploymentId: string) {
    if (this.queuedIds.has(deploymentId)) {
      return;
    }

    this.queue.push({ deploymentId });
    this.queuedIds.add(deploymentId);
    void this.drainQueue();
  }

  async restoreRecoverableDeployments() {
    const recoverable = await this.repository.listRecoverableDeployments();

    for (const deployment of recoverable) {
      this.enqueue(deployment.id);
    }

    return recoverable.length;
  }

  private async drainQueue() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        continue;
      }

      this.queuedIds.delete(job.deploymentId);
      await this.runDeployment(job.deploymentId);
    }

    this.processing = false;
  }

  private async runDeployment(deploymentId: string) {
    try {
      const deployment = await this.repository.getDeployment(deploymentId);
      if (!deployment) {
        return;
      }

      if (env.pipelineMode === "live") {
        await this.runLiveDeployment(deployment);
        return;
      }

      await this.runStubDeployment(deployment);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown pipeline failure";
      await this.log(deploymentId, "deploy", "stderr", message);
      await this.transition(deploymentId, "failed", {
        failureReason: message,
        finishedAt: new Date().toISOString()
      });
    }
  }

  private async runStubDeployment(deployment: DeploymentRow) {
    await this.transition(deployment.id, "building", { startedAt: new Date().toISOString() });
    await this.log(deployment.id, "build", "system", "Deployment accepted into the pipeline.");
    await delay(300);
    await this.log(deployment.id, "build", "stdout", "Preparing isolated workspace.");
    await delay(500);
    await this.log(
      deployment.id,
      "build",
      "system",
      "PIPELINE_MODE=stub, so external build/runtime commands are skipped."
    );
    await delay(400);

    const imageTag = `brimble-demo:${deployment.id}`;
    await this.transition(deployment.id, "deploying", { imageTag });
    await this.log(deployment.id, "deploy", "stdout", `Reserved image tag ${imageTag}.`);
    await delay(500);

    const containerName = `brimble-${deployment.id}`;
    await this.log(
      deployment.id,
      "deploy",
      "stdout",
      `Planned container ${containerName} and route ${deployment.routePath}.`
    );
    await delay(600);

    await this.transition(deployment.id, "running", {
      containerName,
      finishedAt: new Date().toISOString()
    });

    await this.log(
      deployment.id,
      "runtime",
      "system",
      "Deployment marked running in stub mode. Switch PIPELINE_MODE=live to use Railpack, Docker, and Caddy."
    );
  }

  private async runLiveDeployment(deployment: DeploymentRow) {
    await this.transition(deployment.id, "building", { startedAt: new Date().toISOString() });
    await this.log(deployment.id, "build", "system", "Deployment accepted into the live pipeline.");

    const buildLogger = this.phaseLogger(deployment.id, "build");
    const { appPath } = await this.workspaceService.prepareWorkspace(deployment, buildLogger);

    const imageTag = `brimble-demo:${deployment.id}`;
    await this.railpackService.buildImage(appPath, imageTag, buildLogger);

    await this.transition(deployment.id, "deploying", { imageTag });
    const deployLogger = this.phaseLogger(deployment.id, "deploy");
    const containerName = `brimble-${deployment.id}`;
    let routePublished = false;

    try {
      await this.dockerService.replaceContainer(imageTag, containerName, deployLogger);

      if (!deployment.routePath) {
        throw new Error(`Deployment ${deployment.id} is missing a route path.`);
      }

      const snippetPath = await this.caddyService.publishRoute(
        deployment.id,
        deployment.routePath,
        containerName
      );
      routePublished = true;
      await deployLogger("system", `Wrote Caddy route snippet ${snippetPath}`);
      await this.caddyService.reload(deployLogger);

      const runtimeLogger = this.phaseLogger(deployment.id, "runtime");
      await this.caddyService.verifyRoute(deployment.routePath, runtimeLogger);

      await this.transition(deployment.id, "running", {
        containerName,
        finishedAt: new Date().toISOString()
      });
      await runtimeLogger("system", "Deployment marked running after route verification.");
    } catch (error) {
      if (routePublished) {
        await this.caddyService.removeRoute(deployment.id);
      }

      throw error;
    }
  }

  private async transition(
    deploymentId: string,
    status: DeploymentStatus,
    extras: Partial<Pick<DeploymentRow, "imageTag" | "containerName" | "failureReason" | "startedAt" | "finishedAt">> = {}
  ) {
    const deployment = await this.repository.updateDeployment(deploymentId, {
      status,
      imageTag: extras.imageTag ?? undefined,
      containerName: extras.containerName ?? undefined,
      failureReason: extras.failureReason ?? undefined,
      startedAt: extras.startedAt ?? undefined,
      finishedAt: extras.finishedAt ?? undefined
    });

    if (deployment) {
      this.eventBus.publish({ type: "status", data: deployment });
    }

    return deployment;
  }

  private async log(
    deploymentId: string,
    phase: DeploymentPhase,
    stream: "stdout" | "stderr" | "system",
    message: string
  ) {
    const log = await this.repository.addLog({
      deploymentId,
      phase,
      stream,
      message
    });

    this.eventBus.publish({ type: "log", data: log });
  }

  private phaseLogger(deploymentId: string, phase: DeploymentPhase) {
    return async (stream: "stdout" | "stderr" | "system", message: string) => {
      await this.log(deploymentId, phase, stream, message);
    };
  }
}
