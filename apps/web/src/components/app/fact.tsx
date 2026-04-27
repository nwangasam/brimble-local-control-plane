export function Fact({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-foreground/10 bg-white/80 px-4 py-3">
      <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </span>
      <span className="mt-2 block break-words text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
