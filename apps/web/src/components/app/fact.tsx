export function Fact({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-3 py-3">
      <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </span>
      <span className="mt-2 block break-words text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
