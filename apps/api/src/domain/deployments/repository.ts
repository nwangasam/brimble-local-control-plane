import { asc, desc, eq, inArray } from "drizzle-orm";
import type {
  DeploymentPhase,
  DeploymentSourceType,
  DeploymentStatus,
  DeploymentStream
} from "@brimble/contracts";

import { db } from "../../db/client.js";
import {
  deploymentLogs,
  deployments,
  type DeploymentLogRow,
  type DeploymentRow
} from "../../db/schema.js";
import { createLogId } from "../../lib/ids.js";

type CreateDeploymentInput = {
  id: string;
  sourceType: DeploymentSourceType;
  sourceValue: string;
  routePath: string;
  workspacePath: string;
};

type UpdateDeploymentInput = Partial<{
  status: DeploymentStatus;
  imageTag: string | null;
  containerName: string | null;
  failureReason: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}>;

export class DeploymentRepository {
  async createDeployment(input: CreateDeploymentInput) {
    const now = new Date().toISOString();

    const row: DeploymentRow = {
      id: input.id,
      sourceType: input.sourceType,
      sourceValue: input.sourceValue,
      status: "pending",
      imageTag: null,
      routePath: input.routePath,
      containerName: null,
      workspacePath: input.workspacePath,
      failureReason: null,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      finishedAt: null
    };

    await db.insert(deployments).values(row).run();
    return row;
  }

  async listDeployments() {
    return db.select().from(deployments).orderBy(desc(deployments.createdAt)).all();
  }

  async listRecoverableDeployments() {
    return db
      .select()
      .from(deployments)
      .where(inArray(deployments.status, ["pending", "building", "deploying"]))
      .orderBy(asc(deployments.createdAt))
      .all();
  }

  async listRunningDeployments() {
    return db
      .select()
      .from(deployments)
      .where(eq(deployments.status, "running"))
      .orderBy(asc(deployments.createdAt))
      .all();
  }

  async getDeployment(id: string) {
    return db.select().from(deployments).where(eq(deployments.id, id)).get() ?? null;
  }

  async updateDeployment(id: string, input: UpdateDeploymentInput) {
    const current = await this.getDeployment(id);
    if (!current) {
      return null;
    }

    const next: Partial<DeploymentRow> = {
      updatedAt: new Date().toISOString()
    };

    if (input.status !== undefined) next.status = input.status;
    if (input.imageTag !== undefined) next.imageTag = input.imageTag;
    if (input.containerName !== undefined) next.containerName = input.containerName;
    if (input.failureReason !== undefined) next.failureReason = input.failureReason;
    if (input.startedAt !== undefined) next.startedAt = input.startedAt;
    if (input.finishedAt !== undefined) next.finishedAt = input.finishedAt;

    await db.update(deployments).set(next).where(eq(deployments.id, id)).run();
    return this.getDeployment(id);
  }

  async addLog(input: {
    deploymentId: string;
    phase: DeploymentPhase;
    stream: DeploymentStream;
    message: string;
  }) {
    const row: DeploymentLogRow = {
      id: createLogId(),
      deploymentId: input.deploymentId,
      phase: input.phase,
      stream: input.stream,
      message: input.message,
      createdAt: new Date().toISOString()
    };

    await db.insert(deploymentLogs).values(row).run();
    return row;
  }

  async getLogs(deploymentId: string) {
    return db
      .select()
      .from(deploymentLogs)
      .where(eq(deploymentLogs.deploymentId, deploymentId))
      .orderBy(deploymentLogs.createdAt)
      .all();
  }
}
