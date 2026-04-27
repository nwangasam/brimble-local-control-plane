import { FileArchive, GitBranch, LoaderCircle, Rocket, Upload } from "lucide-react"
import { useId, useRef } from "react"

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui"
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
        "flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all",
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
  const uploadId = useId()
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const isSubmitDisabled =
    props.isPending ||
    (props.sourceMode === "git" ? props.gitUrl.trim().length === 0 : !props.selectedFile)

  return (
    <Card className="surface-panel border border-border/70 bg-card/90" size="sm">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>New deployment</CardTitle>
          </div>
          <Badge variant="outline" className="rounded-lg shadow-none">Pipeline</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1">
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
              className="rounded-lg border-border/70 bg-background"
            />
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="text-sm text-foreground">Project archive</span>
            <input
              id={uploadId}
              ref={uploadInputRef}
              type="file"
              accept=".zip"
              onChange={(event) => props.onFileChange(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
            >
              <span className="min-w-0 truncate text-sm text-foreground">
                {props.selectedFile ? props.selectedFile.name : "Choose .zip file"}
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="size-3.5" />
                Browse
              </span>
            </button>
          </label>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            size="lg"
            onClick={props.onSubmit}
            disabled={isSubmitDisabled}
            className="rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90"
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
