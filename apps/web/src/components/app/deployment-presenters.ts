import type { Deployment, DeploymentLog, DeploymentStatus, DeploymentStream } from "@/api"

export const statusTone: Record<DeploymentStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  building: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  deploying: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  running: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  failed: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
}

export const statusCopy: Record<DeploymentStatus, string> = {
  pending: "Queued for execution",
  building: "Railpack is producing the image",
  deploying: "Docker and Caddy are being updated",
  running: "Route is live behind Caddy",
  failed: "Pipeline stopped with an error",
}

export function renderSourceLabel(deployment: Deployment) {
  if (deployment.sourceType === "git") {
    return deployment.sourceValue
  }

  return deployment.sourceValue.split("/").at(-1) ?? deployment.sourceValue
}

export function toneForStream(stream: DeploymentStream) {
  switch (stream) {
    case "stderr":
      return "text-rose-300"
    case "system":
      return "text-amber-200"
    default:
      return "text-sky-200"
  }
}

export function mergeLogs(logs: DeploymentLog[]) {
  const unique = new Map<string, DeploymentLog>()
  for (const log of logs) {
    unique.set(log.id, log)
  }

  return [...unique.values()].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  )
}

export function formatLogTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function formatDeploymentTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
