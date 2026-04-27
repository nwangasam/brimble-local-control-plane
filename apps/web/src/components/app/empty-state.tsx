export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-foreground/15 bg-white/55 px-5 py-10 text-center">
      <p className="text-base font-medium tracking-[-0.03em]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}
