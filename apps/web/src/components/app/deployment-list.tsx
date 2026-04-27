import { Package } from "lucide-react"

import type { Deployment } from "@/api"
import { EmptyState } from "@/components/app/empty-state"
import { renderSourceLabel, statusTone } from "@/components/app/deployment-presenters"
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { cn } from "@/lib/utils"

export function DeploymentList(props: {
  deployments: Deployment[]
  isLoading: boolean
  errorMessage: string | null
  selectedDeploymentId: string | null
  onSelect: (deploymentId: string) => void
}) {
  return (
    <Card className="surface-panel bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="size-5 text-primary" />
          Deployment queue
        </CardTitle>
        <CardDescription>
          Newest first. Select one row to inspect its current state and logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.errorMessage ? (
          <EmptyState
            title="Unable to load deployments"
            body={props.errorMessage}
          />
        ) : props.isLoading && props.deployments.length === 0 ? (
          <EmptyState
            title="Loading deployments"
            body="Fetching the current deployment queue from the API."
          />
        ) : props.deployments.length === 0 ? (
          <EmptyState
            title="No deployments yet"
            body="Create one from a Git URL or upload a sample app archive to start the pipeline."
          />
        ) : (
          props.deployments.map((deployment) => (
            <button
              key={deployment.id}
              type="button"
              onClick={() => props.onSelect(deployment.id)}
              className={cn(
                "w-full rounded-[1.25rem] border px-4 py-4 text-left transition-all",
                props.selectedDeploymentId === deployment.id
                  ? "border-primary/40 bg-primary/5 shadow-(--shadow-button)"
                  : "border-border/80 bg-background/60 hover:border-primary/20 hover:bg-background"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium tracking-[-0.03em]">{deployment.id}</span>
                    <Badge className={cn("capitalize shadow-none", statusTone[deployment.status])}>
                      {deployment.status}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {renderSourceLabel(deployment)}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {deployment.sourceType}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <span className="block uppercase tracking-[0.18em]">route</span>
                  <span className="mt-1 block font-medium text-foreground">
                    {deployment.routePath ?? "pending"}
                  </span>
                </div>
                <div>
                  <span className="block uppercase tracking-[0.18em]">image</span>
                  <span className="mt-1 block truncate font-medium text-foreground">
                    {deployment.imageTag ?? "not built yet"}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )
}
