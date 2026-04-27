import { useQuery } from "@tanstack/react-query"

import { deploymentKeys, fetchDeploymentLogs } from "@/api"

export function useDeploymentLogsQuery(deploymentId: string | null) {
  return useQuery({
    queryKey: deploymentKeys.logs(deploymentId),
    queryFn: () => fetchDeploymentLogs(deploymentId!).then((result) => result.logs),
    enabled: Boolean(deploymentId),
  })
}
