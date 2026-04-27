import { ExternalLink, Logs } from "lucide-react"

import type { Deployment, DeploymentLog } from "@/api"
import { EmptyState } from "@/components/app/empty-state"
import { Fact } from "@/components/app/fact"
import {
  formatLogTime,
  statusCopy,
  statusTone,
  toneForStream,
} from "@/components/app/deployment-presenters"
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, ScrollArea, Separator } from "@/components/ui"
import { cn } from "@/lib/utils"

export function DeploymentDetail(props: {
  deployment: Deployment | null | undefined
  logs: DeploymentLog[]
  streamConnected: boolean
  isLoading: boolean
  errorMessage: string | null
}) {
  const { deployment, logs, streamConnected, isLoading, errorMessage } = props

  return (
    <Card className="surface-panel bg-card/80 backdrop-blur-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Logs className="size-5 text-primary" />
              {deployment ? deployment.id : "Deployment detail"}
            </CardTitle>
            <CardDescription className="mt-1">
              {deployment
                ? statusCopy[deployment.status]
                : "Select a deployment to inspect its lifecycle and live output."}
            </CardDescription>
          </div>
          {deployment ? (
            <div className="flex items-center gap-2">
              <Badge className={cn("capitalize shadow-none", statusTone[deployment.status])}>
                {deployment.status}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border-border/80 bg-background/80",
                  streamConnected && "border-[color:var(--success)] text-[color:var(--success-foreground)]"
                )}
              >
                {streamConnected ? "SSE live" : "waiting for stream"}
              </Badge>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {errorMessage ? (
          <EmptyState
            title="Unable to load deployment detail"
            body={errorMessage}
          />
        ) : isLoading && !deployment ? (
          <EmptyState
            title="Loading deployment detail"
            body="Fetching deployment metadata and retained logs."
          />
        ) : !deployment ? (
          <EmptyState
            title="Nothing selected"
            body="Pick a deployment from the queue to see metadata, status transitions, and retained logs."
          />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <Fact title="Image tag" value={deployment.imageTag ?? "building…"} />
              <Fact title="Container" value={deployment.containerName ?? "not started"} />
              <Fact title="Route" value={deployment.routePath ?? "pending"} />
            </div>

            {deployment.routePath && deployment.status === "running" ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-[color:var(--success)]/35 bg-[color:var(--success)]/12 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[color:var(--success-foreground)]">Deployment is live behind Caddy</p>
                  <p className="text-sm text-[color:var(--success-foreground)]/80">
                    Open the proxied route directly from the control plane.
                  </p>
                </div>
                <a
                  href={`${deployment.routePath}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--success)]/45 bg-background px-4 py-2 text-sm font-medium text-[color:var(--success-foreground)]"
                >
                  Open route
                  <ExternalLink className="size-4" />
                </a>
              </div>
            ) : null}

            {deployment.failureReason ? (
              <div className="rounded-[1.2rem] border border-destructive/25 bg-[color:var(--danger-surface)] px-4 py-3 text-sm text-[color:var(--danger-foreground)]">
                {deployment.failureReason}
              </div>
            ) : null}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium tracking-[0.02em]">Build and deploy logs</h2>
                  <p className="text-sm text-muted-foreground">
                    Historical log rows plus the live SSE tail.
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full border-border/80 bg-background/80">
                  {logs.length} rows
                </Badge>
              </div>
              <ScrollArea className="h-[29rem] rounded-[1.4rem] border border-border/80 bg-[color:var(--panel-strong)] p-0">
                <div className="space-y-0 px-4 py-4 font-mono text-xs text-[color:var(--panel-strong-foreground)]">
                  {logs.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      Logs will appear here as soon as the selected deployment emits output.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="grid grid-cols-[auto_auto_1fr] gap-3 border-b border-white/6 py-2 last:border-b-0"
                      >
                        <span className="text-muted-foreground">
                          {formatLogTime(log.createdAt)}
                        </span>
                        <span className={cn("uppercase", toneForStream(log.stream))}>
                          {log.phase}.{log.stream}
                        </span>
                        <span className="whitespace-pre-wrap break-words">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
