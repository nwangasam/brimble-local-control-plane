import { useQuery } from "@tanstack/react-query"

import { deploymentKeys, fetchDeployment } from "@/api"

export function useDeploymentQuery(deploymentId: string | null) {
  return useQuery({
    queryKey: deploymentKeys.detail(deploymentId),
    queryFn: () => fetchDeployment(deploymentId!).then((result) => result.deployment),
    enabled: Boolean(deploymentId),
    refetchInterval: (query) => {
      const deployment = query.state.data
      if (!deployment) {
        return 5000
      }

      return deployment.status === "running" || deployment.status === "failed" ? 15000 : 3000
    },
  })
}
