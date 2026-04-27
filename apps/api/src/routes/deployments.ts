import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import {
  createGitDeploymentRequestSchema,
  createUploadDeploymentFieldsSchema,
  deploymentLogsResponseSchema,
  deploymentParamsSchema,
  deploymentResponseSchema,
  deploymentsResponseSchema,
  healthResponseSchema
} from "@brimble/contracts";
import type { FastifyInstance } from "fastify";

import { DeploymentRepository } from "../domain/deployments/repository.js";
import { env } from "../lib/env.js";
import { ensureDir } from "../lib/fs.js";
import { createDeploymentId } from "../lib/ids.js";
import { PipelineRunner } from "../services/pipeline-runner.js";
import { WorkspaceService } from "../services/workspace-service.js";

type DeploymentRouteDeps = {
  repository: DeploymentRepository;
  pipelineRunner: PipelineRunner;
  workspaceService: WorkspaceService;
};

export async function registerDeploymentRoutes(
  app: FastifyInstance,
  deps: DeploymentRouteDeps
) {
  app.get("/api/health", async () => healthResponseSchema.parse({ ok: true }));

  app.get("/api/deployments", async () => {
    const deployments = await deps.repository.listDeployments();
    return deploymentsResponseSchema.parse({ deployments });
  });

  app.get("/api/deployments/:id", async (request, reply) => {
    const { id } = deploymentParamsSchema.parse(request.params);
    const deployment = await deps.repository.getDeployment(id);

    if (!deployment) {
      return reply.code(404).send({ error: "Deployment not found" });
    }

    return deploymentResponseSchema.parse({ deployment });
  });

  app.get("/api/deployments/:id/logs", async (request, reply) => {
    const { id } = deploymentParamsSchema.parse(request.params);
    const deployment = await deps.repository.getDeployment(id);

    if (!deployment) {
      return reply.code(404).send({ error: "Deployment not found" });
    }

    const logs = await deps.repository.getLogs(id);
    return deploymentLogsResponseSchema.parse({ logs });
  });

  app.post("/api/deployments", async (request, reply) => {
    ensureDir(env.uploadsDir);
    ensureDir(env.workspacesDir);

    let sourceType: "git" | "upload" | null = null;
    let sourceValue: string | null = null;

    if (request.isMultipart()) {
      const parts = request.parts();
      const deploymentId = createDeploymentId();

      for await (const part of parts) {
        if (part.type === "field" && part.fieldname === "sourceType") {
          const parsed = createUploadDeploymentFieldsSchema.safeParse({
            sourceType: part.value
          });
          sourceType = parsed.success ? parsed.data.sourceType : null;
        }

        if (part.type === "file" && part.fieldname === "file") {
          const uploadPath = path.join(env.uploadsDir, `${deploymentId}-${part.filename}`);
          await fs.promises.mkdir(path.dirname(uploadPath), { recursive: true });
          await pipeline(part.file, fs.createWriteStream(uploadPath));
          sourceValue = uploadPath;
        }
      }

      if (sourceType !== "upload" || !sourceValue) {
        return reply
          .code(400)
          .send({ error: "Multipart uploads require sourceType=upload and a file field." });
      }

      if (!sourceValue.toLowerCase().endsWith(".zip")) {
        return reply.code(400).send({ error: "Only .zip uploads are supported." });
      }

      const workspacePath = deps.workspaceService.createWorkspacePath(deploymentId);
      const deployment = await deps.repository.createDeployment({
        id: deploymentId,
        sourceType,
        sourceValue,
        routePath: `/d/${deploymentId}`,
        workspacePath
      });

      deps.pipelineRunner.enqueue(deploymentId);
      return reply.code(201).send(deploymentResponseSchema.parse({ deployment }));
    }

    const parsedBody = createGitDeploymentRequestSchema.safeParse(request.body ?? {});
    if (!parsedBody.success) {
      return reply
        .code(400)
        .send({ error: "JSON submissions require sourceType=git and a valid gitUrl." });
    }

    const deploymentId = createDeploymentId();
    const workspacePath = deps.workspaceService.createWorkspacePath(deploymentId);
    const deployment = await deps.repository.createDeployment({
      id: deploymentId,
      sourceType: "git",
      sourceValue: parsedBody.data.gitUrl,
      routePath: `/d/${deploymentId}`,
      workspacePath
    });

    deps.pipelineRunner.enqueue(deploymentId);
    return reply.code(201).send(deploymentResponseSchema.parse({ deployment }));
  });
}
