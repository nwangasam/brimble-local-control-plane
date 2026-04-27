import { FileArchive, GitBranch, LoaderCircle, Rocket } from "lucide-react"

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui"
import { cn } from "@/lib/utils"

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof GitBranch
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[1rem] px-3 py-3 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-(--shadow-button)"
          : "text-muted-foreground hover:bg-background/10 hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export function CreateDeploymentCard(props: {
  sourceMode: "git" | "upload"
  gitUrl: string
  selectedFile: File | null
  isPending: boolean
  errorMessage: string | null
  onSourceModeChange: (mode: "git" | "upload") => void
  onGitUrlChange: (value: string) => void
  onFileChange: (file: File | null) => void
  onSubmit: () => void
}) {
  const isSubmitDisabled =
    props.isPending ||
    (props.sourceMode === "git" ? props.gitUrl.trim().length === 0 : !props.selectedFile)

  return (
    <Card className="surface-panel-strong border-0 ring-1 ring-border/70">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Create deployment</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Git URL or uploaded project archive. No auth, no extra ceremony.
            </CardDescription>
          </div>
          <Badge className="bg-background/10 text-foreground shadow-none">API-first</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-background/5 p-1">
          <ModeButton
            active={props.sourceMode === "git"}
            icon={GitBranch}
            label="Git URL"
            onClick={() => props.onSourceModeChange("git")}
          />
          <ModeButton
            active={props.sourceMode === "upload"}
            icon={FileArchive}
            label="Upload zip"
            onClick={() => props.onSourceModeChange("upload")}
          />
        </div>

        {props.sourceMode === "git" ? (
          <label className="block space-y-2">
            <span className="text-sm text-foreground">Repository URL</span>
            <Input
              value={props.gitUrl}
              onChange={(event) => props.onGitUrlChange(event.target.value)}
              placeholder="https://github.com/owner/repo"
              className="border-border/60 bg-background/5 text-foreground placeholder:text-muted-foreground"
            />
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="text-sm text-foreground">Project archive</span>
            <Input
              type="file"
              accept=".zip"
              onChange={(event) => props.onFileChange(event.target.files?.[0] ?? null)}
              className="border-border/60 bg-background/5 text-foreground file:mr-4 file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Upload support is intentionally narrow: `.zip` only, per the project scope.
            </p>
          </label>
        )}

        <div className="space-y-2 rounded-[1rem] border border-border/60 bg-background/5 px-4 py-3">
          <p className="text-sm text-foreground">Execution note</p>
          <p className="text-sm leading-6 text-muted-foreground">
            First-time Railpack builds may look quiet for a short period while builder and runtime
            images are pulled.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="max-w-xs text-xs leading-6 text-muted-foreground">
            First build can look quiet while Railpack pulls its base images. The API now emits
            verbose Railpack logs so the operator can see real progress.
          </p>
          <Button
            size="lg"
            onClick={props.onSubmit}
            disabled={isSubmitDisabled}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          >
            {props.isPending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Starting
              </>
            ) : (
              <>
                <Rocket className="size-4" />
                Create deployment
              </>
            )}
          </Button>
        </div>

        {props.errorMessage ? (
          <p className="text-sm text-destructive">{props.errorMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
