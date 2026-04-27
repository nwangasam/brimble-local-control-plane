export const deploymentKeys = {
  all: ["deployments"] as const,
  detail: (id: string | null) => ["deployment", id] as const,
  logs: (id: string | null) => ["deployment-logs", id] as const,
}
