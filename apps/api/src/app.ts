import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";

import { DeploymentRepository } from "./domain/deployments/repository.js";
import { env } from "./lib/env.js";
import { ensureDir } from "./lib/fs.js";
import { registerDeploymentRoutes } from "./routes/deployments.js";
import { registerEventRoutes } from "./routes/events.js";
import { CaddyService } from "./services/caddy-service.js";
import { DockerService } from "./services/docker-service.js";
import { DeploymentEventBus } from "./services/event-bus.js";
import { PipelineRunner } from "./services/pipeline-runner.js";
import { RailpackService } from "./services/railpack-service.js";
import { WorkspaceService } from "./services/workspace-service.js";

export async function buildApp() {
  ensureDir(env.uploadsDir);
  ensureDir(env.workspacesDir);
  ensureDir(env.caddyGeneratedDir);

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: env.corsOrigin });
  await app.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024
    }
  });

  const repository = new DeploymentRepository();
  const eventBus = new DeploymentEventBus();
  const workspaceService = new WorkspaceService();
  const railpackService = new RailpackService();
  const dockerService = new DockerService();
  const caddyService = new CaddyService();
  const pipelineRunner = new PipelineRunner(
    repository,
    eventBus,
    workspaceService,
    railpackService,
    dockerService,
    caddyService
  );

  await registerDeploymentRoutes(app, { repository, pipelineRunner, workspaceService });
  await registerEventRoutes(app, { repository, eventBus });

  const runningDeployments = await repository.listRunningDeployments();
  await caddyService.reconcileRoutes(
    runningDeployments
      .filter((deployment) => deployment.routePath && deployment.containerName)
      .map((deployment) => ({
        deploymentId: deployment.id,
        routePath: deployment.routePath!,
        containerName: deployment.containerName!
      }))
  );

  const restoredDeployments = await pipelineRunner.restoreRecoverableDeployments();
  if (restoredDeployments > 0) {
    app.log.info(
      { restoredDeployments },
      "Re-enqueued recoverable deployments after API startup."
    );
  }

  return app;
}
