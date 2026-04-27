import "@fontsource-variable/geist"

import { useMemo, useState } from "react"

import {
  AppShell,
  CreateDeploymentCard,
  DeploymentDetail,
  DeploymentList,
  metricIcons,
} from "@/components/app"
import {
  useCreateDeploymentMutation,
  useDeploymentLogsQuery,
  useDeploymentQuery,
  useDeploymentsQuery,
  useLiveDeploymentLogs,
  useSelectedDeployment,
} from "@/hooks/deployments"
import { useTheme } from "@/hooks/ui"

function App() {
  const { theme, toggleTheme } = useTheme()
  const [sourceMode, setSourceMode] = useState<"git" | "upload">("git")
  const [gitUrl, setGitUrl] = useState("https://github.com/heroku/node-js-getting-started")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const deploymentsQuery = useDeploymentsQuery()
  const { selectedDeploymentId, setSelectedDeploymentId } = useSelectedDeployment(
    deploymentsQuery.data
  )
  const selectedDeploymentQuery = useDeploymentQuery(selectedDeploymentId)
  const selectedLogsQuery = useDeploymentLogsQuery(selectedDeploymentId)
  const liveLogsState = useLiveDeploymentLogs(selectedDeploymentId, selectedLogsQuery.data)

  const createDeploymentMutation = useCreateDeploymentMutation({
    onCreated: setSelectedDeploymentId,
    onUploadSettled: () => setSelectedFile(null),
  })

  const metrics = useMemo(() => {
    const items = deploymentsQuery.data ?? []
    const running = items.filter((item) => item.status === "running").length
    const active = items.filter((item) =>
      ["pending", "building", "deploying"].includes(item.status)
    ).length
    const failed = items.filter((item) => item.status === "failed").length

    return [
      { label: "running", value: running.toString().padStart(2, "0"), icon: metricIcons.running },
      { label: "active", value: active.toString().padStart(2, "0"), icon: metricIcons.active },
      { label: "failed", value: failed.toString().padStart(2, "0"), icon: metricIcons.failed },
    ]
  }, [deploymentsQuery.data])

  const createErrorMessage =
    createDeploymentMutation.error instanceof Error
      ? createDeploymentMutation.error.message
      : createDeploymentMutation.error
        ? "Deployment request failed"
        : null

  return (
    <AppShell metrics={metrics} theme={theme} onToggleTheme={toggleTheme}>
      <div className="flex flex-col gap-4">
        <CreateDeploymentCard
          sourceMode={sourceMode}
          gitUrl={gitUrl}
          selectedFile={selectedFile}
          isPending={createDeploymentMutation.isPending}
          errorMessage={createErrorMessage}
          onSourceModeChange={setSourceMode}
          onGitUrlChange={setGitUrl}
          onFileChange={setSelectedFile}
          onSubmit={() =>
            createDeploymentMutation.mutate(
              sourceMode === "git"
                ? { sourceMode, gitUrl }
                : { sourceMode, file: selectedFile }
            )
          }
        />
        <DeploymentList
          deployments={deploymentsQuery.data ?? []}
          isLoading={deploymentsQuery.isLoading}
          errorMessage={
            deploymentsQuery.error instanceof Error
              ? deploymentsQuery.error.message
              : deploymentsQuery.error
                ? "Unable to load deployments."
                : null
          }
          selectedDeploymentId={selectedDeploymentId}
          onSelect={setSelectedDeploymentId}
        />
      </div>

      <DeploymentDetail
        deployment={selectedDeploymentQuery.data}
        logs={liveLogsState.logs}
        streamConnected={liveLogsState.connected}
        isLoading={selectedDeploymentQuery.isLoading || selectedLogsQuery.isLoading}
        errorMessage={
          selectedDeploymentQuery.error instanceof Error
            ? selectedDeploymentQuery.error.message
            : selectedLogsQuery.error instanceof Error
              ? selectedLogsQuery.error.message
              : selectedDeploymentQuery.error || selectedLogsQuery.error
                ? "Unable to load deployment detail."
                : null
        }
      />
    </AppShell>
  )
}

export default App
