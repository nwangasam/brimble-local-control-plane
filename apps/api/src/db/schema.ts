import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const deployments = sqliteTable("deployments", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  sourceValue: text("source_value").notNull(),
  status: text("status").notNull(),
  imageTag: text("image_tag"),
  routePath: text("route_path"),
  containerName: text("container_name"),
  workspacePath: text("workspace_path"),
  failureReason: text("failure_reason"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  startedAt: text("started_at"),
  finishedAt: text("finished_at")
});

export const deploymentLogs = sqliteTable("deployment_logs", {
  id: text("id").primaryKey(),
  deploymentId: text("deployment_id").notNull(),
  phase: text("phase").notNull(),
  stream: text("stream").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull()
});

export type DeploymentRow = typeof deployments.$inferSelect;
export type NewDeploymentRow = typeof deployments.$inferInsert;
export type DeploymentLogRow = typeof deploymentLogs.$inferSelect;
export type NewDeploymentLogRow = typeof deploymentLogs.$inferInsert;

