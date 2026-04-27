import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { deploymentKeys, type Deployment, type DeploymentLog } from "@/api"
import { mergeLogs } from "@/components/app/deployment-presenters"
import { useDeploymentEvents } from "@/hooks/deployments"

export function useLiveDeploymentLogs(
  deploymentId: string | null,
  persistedLogs: DeploymentLog[] | undefined
) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<{
    connected: boolean
    logs: DeploymentLog[]
  }>({
    connected: false,
    logs: [],
  })

  useEffect(() => {
    setState({
      connected: false,
      logs: mergeLogs(persistedLogs ?? []),
    })
  }, [deploymentId, persistedLogs])

  useDeploymentEvents(deploymentId, {
    onReady: () => {
      setState((current) => ({ ...current, connected: true }))
    },
    onLog: (log) => {
      setState((current) => ({
        ...current,
        logs: mergeLogs([...current.logs, log]),
      }))
    },
    onStatus: (deployment) => {
      queryClient.setQueryData(deploymentKeys.detail(deployment.id), deployment)
      queryClient.setQueryData<Deployment[] | undefined>(deploymentKeys.all, (current) =>
        current
          ? current
              .map((item) => (item.id === deployment.id ? deployment : item))
              .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
          : [deployment]
      )
    },
  })

  return state
}
