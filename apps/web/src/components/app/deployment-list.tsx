import { Package } from "lucide-react"

import type { Deployment } from "@/api"
import { EmptyState } from "@/components/app/empty-state"
import { formatDeploymentTime, renderSourceLabel, statusTone } from "@/components/app/deployment-presenters"
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
    <Card className="surface-panel border border-border/70 bg-card/90" size="sm">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="size-5 text-primary" />
          Deployments
        </CardTitle>
        <CardDescription>Newest first. Select a deployment to inspect its build and runtime.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-3">
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
                "w-full rounded-xl border px-3 py-3 text-left transition-all",
                props.selectedDeploymentId === deployment.id
                  ? "border-primary/35 bg-primary/5 shadow-(--shadow-button)"
                  : "border-border/70 bg-background hover:border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{deployment.id}</span>
                    <Badge className={cn("capitalize shadow-none", statusTone[deployment.status])} variant="outline">
                      {deployment.status}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {renderSourceLabel(deployment)}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="uppercase tracking-[0.16em]">{deployment.sourceType}</div>
                  <div className="mt-1 normal-case">{formatDeploymentTime(deployment.createdAt)}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <span className="block uppercase tracking-[0.16em]">route</span>
                  <span className="mt-1 block truncate font-medium text-foreground">
                    {deployment.routePath ?? "pending"}
                  </span>
                </div>
                <div>
                  <span className="block uppercase tracking-[0.16em]">image</span>
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
