import { z } from "zod"

export const deploymentStatusSchema = z.enum([
  "pending",
  "building",
  "deploying",
  "running",
  "failed",
])

export const deploymentSourceTypeSchema = z.enum(["git", "upload"])
export const deploymentPhaseSchema = z.enum(["build", "deploy", "runtime"])
export const deploymentStreamSchema = z.enum(["stdout", "stderr", "system"])

export const deploymentSchema = z.object({
  id: z.string().min(1),
  sourceType: deploymentSourceTypeSchema,
  sourceValue: z.string().min(1),
  status: deploymentStatusSchema,
  imageTag: z.string().nullable(),
  routePath: z.string().nullable(),
  containerName: z.string().nullable(),
  workspacePath: z.string().nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
})

export const deploymentLogSchema = z.object({
  id: z.string().min(1),
  deploymentId: z.string().min(1),
  phase: deploymentPhaseSchema,
  stream: deploymentStreamSchema,
  message: z.string(),
  createdAt: z.string(),
})

export const deploymentParamsSchema = z.object({
  id: z.string().min(1),
})

export const createGitDeploymentRequestSchema = z.object({
  sourceType: z.literal("git"),
  gitUrl: z
    .url()
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "gitUrl must use http or https",
    }),
})

export const createUploadDeploymentFieldsSchema = z.object({
  sourceType: z.literal("upload"),
})

export const healthResponseSchema = z.object({
  ok: z.literal(true),
})

export const errorResponseSchema = z.object({
  error: z.string(),
})

export const deploymentsResponseSchema = z.object({
  deployments: z.array(deploymentSchema),
})

export const deploymentResponseSchema = z.object({
  deployment: deploymentSchema,
})

export const deploymentLogsResponseSchema = z.object({
  logs: z.array(deploymentLogSchema),
})

export const deploymentReadyEventSchema = z.object({
  deploymentId: z.string().min(1),
})

export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>
export type DeploymentSourceType = z.infer<typeof deploymentSourceTypeSchema>
export type DeploymentPhase = z.infer<typeof deploymentPhaseSchema>
export type DeploymentStream = z.infer<typeof deploymentStreamSchema>
export type Deployment = z.infer<typeof deploymentSchema>
export type DeploymentLog = z.infer<typeof deploymentLogSchema>
export type DeploymentParams = z.infer<typeof deploymentParamsSchema>
export type CreateGitDeploymentRequest = z.infer<typeof createGitDeploymentRequestSchema>
