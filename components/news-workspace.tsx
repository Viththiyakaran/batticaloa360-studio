"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, LoaderCircle, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { NewsItem, seedNews } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function NewsWorkspace() {
  const [items, setItems] = useState(seedNews);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const visible = useMemo(() => items.filter(i => (filter === "all" || i.verificationStatus === filter) && `${i.headline} ${i.summary}`.toLowerCase().includes(query.toLowerCase())), [items, filter, query]);
  async function importUrl() {
    setBusy(true); setMessage("");
    const res = await fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const body = await res.json(); setBusy(false);
    if (!res.ok) return setMessage(body.error ?? "Import failed");
    if (items.some(i => i.sourceUrl === body.item.sourceUrl)) return setMessage("Duplicate URL: this source is already in the queue.");
    setItems(current => [body.item as NewsItem, ...current]); setUrl(""); setMessage("Source imported and marked for verification.");
  }
  function verify(id: string) { setItems(current => current.map(i => i.id === id ? { ...i, verificationStatus: "verified" } : i)); }
  return <>
    <div className="card mb-5 p-4"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><input className="input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste a permitted public article URL…" type="url"/><button className="btn btn-primary" disabled={busy || !url} onClick={importUrl}>{busy ? <LoaderCircle className="spin" size={17}/> : <RefreshCw size={17}/>}Import source</button></div>{message && <p className="mt-2 text-sm text-[var(--muted)]" role="status">{message}</p>}</div>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"/><input className="input !pl-10" placeholder="Search headlines and summaries…" value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="input sm:w-52" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All verification states</option><option value="unverified">Unverified</option><option value="verified">Verified</option><option value="outdated">Outdated</option><option value="unverifiable">Unverifiable</option></select></div>
    <div className="space-y-3">{visible.map(item => <article className="card grid gap-4 p-5 lg:grid-cols-[1fr_auto]" key={item.id}><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="badge bg-[var(--accent-soft)] text-[#d85312]">{item.category}</span><span className={`badge ${item.verificationStatus === "verified" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{item.verificationStatus === "verified" ? <CheckCircle2 size={12} className="mr-1"/> : null}{item.verificationStatus}</span><span className="text-xs text-[var(--muted)]">Discovered {formatDate(item.discoveredAt)}</span></div><h2 className="text-lg font-black" lang="ta">{item.headline}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]" lang="ta">{item.summary}</p><a className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f26a21]" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceName}<ArrowUpRight size={13}/></a></div><div className="flex items-end gap-2 lg:flex-col lg:justify-center">{item.verificationStatus !== "verified" && <button className="btn btn-secondary flex-1 text-sm lg:flex-none" onClick={()=>verify(item.id)}><ShieldCheck size={16}/>Mark verified</button>}<Link href={`/content?news=${item.id}`} className="btn btn-primary flex-1 text-sm lg:flex-none">Generate content</Link></div></article>)}</div>
  </>;
}
