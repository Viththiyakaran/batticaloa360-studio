export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div>{eyebrow && <div className="mb-2 text-xs font-black uppercase tracking-[.18em] text-[#f26a21]">{eyebrow}</div>}<h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1><p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">{description}</p></div>{action}</div>;
}
