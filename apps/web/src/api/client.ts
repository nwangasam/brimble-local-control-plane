import {
  createGitDeploymentRequestSchema,
  deploymentLogsResponseSchema,
  deploymentResponseSchema,
  deploymentsResponseSchema,
} from "@brimble/contracts"

const API_BASE = import.meta.env.VITE_API_BASE ?? ""

export async function fetchDeployments() {
  const response = await fetch(`${API_BASE}/api/deployments`)
  return handleJson(response, deploymentsResponseSchema)
}

export async function fetchDeployment(id: string) {
  const response = await fetch(`${API_BASE}/api/deployments/${id}`)
  return handleJson(response, deploymentResponseSchema)
}

export async function fetchDeploymentLogs(id: string) {
  const response = await fetch(`${API_BASE}/api/deployments/${id}/logs`)
  return handleJson(response, deploymentLogsResponseSchema)
}

export async function createGitDeployment(gitUrl: string) {
  const payload = createGitDeploymentRequestSchema.parse({
    sourceType: "git",
    gitUrl,
  })

  const response = await fetch(`${API_BASE}/api/deployments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleJson(response, deploymentResponseSchema)
}

export async function createUploadDeployment(file: File) {
  const formData = new FormData()
  formData.append("sourceType", "upload")
  formData.append("file", file)

  const response = await fetch(`${API_BASE}/api/deployments`, {
    method: "POST",
    body: formData,
  })

  return handleJson(response, deploymentResponseSchema)
}

export function getDeploymentEventsUrl(id: string) {
  const base =
    typeof window !== "undefined"
      ? new URL(API_BASE || window.location.origin, window.location.origin)
      : new URL(API_BASE || "http://localhost")

  base.pathname = `/api/deployments/${id}/events`
  base.search = ""
  return base.toString()
}

async function handleJson<T>(
  response: Response,
  schema: { parse: (input: unknown) => T }
) {
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed")
  }

  return schema.parse(data)
}
