import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileImage, FileText, Newspaper, Play, RefreshCw, Video } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { seedNews } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const stats = [
  ["New stories", "12", Newspaper, "text-blue-600", "bg-blue-50 dark:bg-blue-950/30"],
  ["Awaiting verification", "5", Clock3, "text-amber-600", "bg-amber-50 dark:bg-amber-950/30"],
  ["Draft posts", "8", FileText, "text-violet-600", "bg-violet-50 dark:bg-violet-950/30"],
  ["Generated images", "24", FileImage, "text-pink-600", "bg-pink-50 dark:bg-pink-950/30"],
  ["Generated videos", "3", Video, "text-cyan-600", "bg-cyan-50 dark:bg-cyan-950/30"],
  ["Published articles", "47", CheckCircle2, "text-green-600", "bg-green-50 dark:bg-green-950/30"],
  ["Failed operations", "1", AlertTriangle, "text-red-600", "bg-red-50 dark:bg-red-950/30"],
] as const;

export default function DashboardPage() {
  return <>
    <PageHeader eyebrow="Editorial overview" title="Good morning, Editor" description="Your Batticaloa news workflow at a glance. No content is published without your approval." action={<Link href="/news" className="btn btn-primary"><RefreshCw size={17}/>Discover latest news</Link>}/>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{stats.map(([label, value, Icon, colour, bg]) => <div className="card p-4" key={label}><span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${colour} ${bg}`}><Icon size={19}/></span><div className="text-2xl font-black">{value}</div><div className="mt-1 text-xs leading-4 text-[var(--muted)]">{label}</div></div>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
      <div className="card overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border)] p-5"><div><h2 className="font-black">Latest discoveries</h2><p className="text-sm text-[var(--muted)]">Recently collected items requiring review</p></div><Link href="/news" className="text-sm font-bold text-[#f26a21]">View all</Link></div><div>{seedNews.map(item => <div key={item.id} className="flex flex-col gap-3 border-b border-[var(--border)] p-5 last:border-0 sm:flex-row sm:items-center"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[#f26a21]"><Newspaper/></div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className="badge bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{item.category}</span><span className="text-xs text-[var(--muted)]">{formatDate(item.discoveredAt)}</span></div><h3 className="truncate font-bold" lang="ta">{item.headline}</h3><p className="mt-1 text-xs text-[var(--muted)]">{item.sourceName}</p></div><Link href={`/content?news=${item.id}`} className="btn btn-secondary !px-3 !py-2 text-sm">Prepare <ArrowRight size={15}/></Link></div>)}</div></div>
      <div className="card p-5"><h2 className="font-black">Editorial workflow</h2><p className="mb-5 text-sm text-[var(--muted)]">Find → Verify → Generate → Edit → Approve → Publish</p><div className="space-y-3">{[["1", "Review new sources", "5 stories await verification", "/news"],["2", "Generate Tamil content", "Create an accurate social caption", "/content"],["3", "Create branded image", "Use a Tamil-safe visual template", "/images"],["4", "Review before publishing", "External publishing stays locked", "/publishing"]].map(([n,t,d,h]) => <Link href={h} key={n} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-[#f26a21]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f26a21] text-sm font-black text-white">{n}</span><span className="min-w-0 flex-1"><b className="block text-sm">{t}</b><small className="text-[var(--muted)]">{d}</small></span><ArrowRight size={16}/></Link>)}</div><button className="btn btn-secondary mt-5 w-full"><Play size={16}/>Watch workflow guide</button></div>
    </section>
  </>;
}
