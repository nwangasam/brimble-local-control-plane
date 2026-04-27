import {
  deploymentParamsSchema,
  deploymentReadyEventSchema,
  deploymentResponseSchema,
  deploymentLogSchema
} from "@brimble/contracts";
import type { FastifyInstance } from "fastify";

import { DeploymentRepository } from "../domain/deployments/repository.js";
import { DeploymentEventBus } from "../services/event-bus.js";

type EventRouteDeps = {
  repository: DeploymentRepository;
  eventBus: DeploymentEventBus;
};

export async function registerEventRoutes(app: FastifyInstance, deps: EventRouteDeps) {
  app.get("/api/deployments/:id/events", async (request, reply) => {
    const { id } = deploymentParamsSchema.parse(request.params);
    const deployment = await deps.repository.getDeployment(id);

    if (!deployment) {
      return reply.code(404).send({ error: "Deployment not found" });
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    });

    reply.raw.write(`event: ready\n`);
    reply.raw.write(
      `data: ${JSON.stringify(deploymentReadyEventSchema.parse({ deploymentId: id }))}\n\n`
    );

    const unsubscribe = deps.eventBus.subscribe(id, (event) => {
      reply.raw.write(`event: ${event.type}\n`);
      const payload =
        event.type === "log"
          ? deploymentLogSchema.parse(event.data)
          : deploymentResponseSchema.shape.deployment.parse(event.data);
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    });

    const keepAlive = setInterval(() => {
      reply.raw.write(`event: ping\n`);
      reply.raw.write(`data: {}\n\n`);
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });
}
