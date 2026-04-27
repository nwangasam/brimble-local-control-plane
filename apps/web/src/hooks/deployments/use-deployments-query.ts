import { useQuery } from "@tanstack/react-query"

import { deploymentKeys, fetchDeployments } from "@/api"

export function useDeploymentsQuery() {
  return useQuery({
    queryKey: deploymentKeys.all,
    queryFn: () => fetchDeployments().then((result) => result.deployments),
    refetchInterval: 5000,
  })
}
