import type { ReactNode } from "react"

import { Activity, LoaderCircle, Moon, Rocket, Sun, Waypoints } from "lucide-react"

import { Button } from "@/components/ui"

type Metric = {
  label: string
  value: string
  icon: typeof Rocket
}

export function AppShell({
  metrics,
  theme,
  onToggleTheme,
  children,
}: {
  metrics: Metric[]
  theme: "light" | "dark"
  onToggleTheme: () => void
  children: ReactNode
}) {
  return (
    <main className="min-h-screen px-4 py-4 text-foreground sm:px-5 lg:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="surface-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background">
              <Waypoints className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Brimble Control Plane</p>
              <p className="truncate text-xs text-muted-foreground">
                Deployments, builds, logs, and routed apps in one place
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex items-center gap-2">
                  <metric.icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                  <span className="min-w-5 text-sm font-medium">{metric.value}</span>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onToggleTheme}
              className="rounded-xl border-border/70 bg-background"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[25rem_minmax(0,1fr)]">
          {children}
        </div>
      </div>
    </main>
  )
}

export const metricIcons = {
  running: Rocket,
  active: LoaderCircle,
  failed: Activity,
}
