export function createDeploymentId() {
  return `dep_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function createLogId() {
  return `log_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

