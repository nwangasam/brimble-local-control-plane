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
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="surface-hero overflow-hidden rounded-[2rem] border border-border/80">
          <div className="grid gap-10 px-6 py-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium tracking-[0.22em] uppercase text-muted-foreground backdrop-blur-sm">
                  <Waypoints className="size-3.5" />
                  brimble local control plane
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onToggleTheme}
                  className="rounded-full border-border/80 bg-background/80 backdrop-blur-sm"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="font-heading max-w-2xl text-4xl leading-none font-medium tracking-[-0.06em] text-balance sm:text-5xl lg:text-6xl">
                  Deploy archives or Git repos through one small, inspectable pipeline.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  This single screen is optimized for the take-home itself: create a deployment,
                  watch status transitions, inspect the produced image tag, and follow build and
                  deploy logs without leaving the page.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[1.4rem] border border-border/80 bg-background/70 px-4 py-4 backdrop-blur-sm"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <metric.icon className="size-4 text-primary" />
                      <span className="text-[0.7rem] tracking-[0.25em] uppercase text-muted-foreground">
                        {metric.label}
                      </span>
                    </div>
                    <div className="text-3xl font-medium tracking-[-0.08em]">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

export const metricIcons = {
  running: Rocket,
  active: LoaderCircle,
  failed: Activity,
}
