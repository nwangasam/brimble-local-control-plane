import { useEffect, useRef } from "react"
import {
  deploymentLogSchema,
  deploymentReadyEventSchema,
  deploymentSchema,
  type Deployment,
  type DeploymentLog,
} from "@brimble/contracts"

import { getDeploymentEventsUrl } from "@/api"

type DeploymentEventHandlers = {
  onLog?: (log: DeploymentLog) => void
  onStatus?: (deployment: Deployment) => void
  onReady?: () => void
}

export function useDeploymentEvents(
  deploymentId: string | null,
  handlers: DeploymentEventHandlers
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!deploymentId) {
      return
    }

    const source = new EventSource(getDeploymentEventsUrl(deploymentId))

    source.addEventListener("ready", (event) => {
      deploymentReadyEventSchema.parse(JSON.parse((event as MessageEvent<string>).data))
      handlersRef.current.onReady?.()
    })

    source.addEventListener("log", (event) => {
      const payload = deploymentLogSchema.parse(
        JSON.parse((event as MessageEvent<string>).data)
      ) as DeploymentLog
      handlersRef.current.onLog?.(payload)
    })

    source.addEventListener("status", (event) => {
      const payload = deploymentSchema.parse(
        JSON.parse((event as MessageEvent<string>).data)
      ) as Deployment
      handlersRef.current.onStatus?.(payload)
    })

    return () => {
      source.close()
    }
  }, [deploymentId])
}
