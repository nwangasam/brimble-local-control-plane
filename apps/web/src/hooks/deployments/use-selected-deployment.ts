import { useEffect, useState } from "react"

import type { Deployment } from "@/api"

export function useSelectedDeployment(deployments: Deployment[] | undefined) {
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null)

  useEffect(() => {
    if (!deployments?.length) {
      setSelectedDeploymentId(null)
      return
    }

    setSelectedDeploymentId((current) => {
      if (current && deployments.some((deployment) => deployment.id === current)) {
        return current
      }

      return deployments[0]?.id ?? null
    })
  }, [deployments])

  return {
    selectedDeploymentId,
    setSelectedDeploymentId,
  }
}
