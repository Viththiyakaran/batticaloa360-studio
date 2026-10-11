"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, BookOpen, Bot, Clapperboard, FileImage, Globe2, LayoutDashboard, Library, Menu, Newspaper, Search, Send, Settings, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Latest News", "/news", Newspaper],
  ["AI Content Generator", "/content", Bot],
  ["Image Studio", "/images", FileImage],
  ["Video Studio", "/videos", Clapperboard],
  ["Publishing Centre", "/publishing", Send],
  ["Content Library", "/library", Library],
  ["News Sources", "/sources", Globe2],
  ["Analytics", "/analytics", BarChart3],
  ["Settings", "/settings", Settings],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[270px_1fr]">
      {open && <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[270px] -translate-x-full flex-col border-r border-[var(--border)] bg-[#171915] p-4 text-white transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", open && "translate-x-0")}>
        <div className="mb-7 flex items-center justify-between px-2 pt-2">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f26a21] font-black">B<span className="text-xs">360</span></span>
            <span><b className="block leading-5">Batticaloa360</b><small className="text-neutral-400">AI Content Studio</small></span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>
        <nav className="space-y-1 overflow-y-auto">
          {nav.map(([label, href, Icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white", active && "bg-[#f26a21] text-white shadow-lg shadow-orange-950/20")}><Icon size={18}/>{label}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-white/5 p-3 text-xs text-neutral-400"><BookOpen size={16} className="mb-2 text-[#f26a21]"/>Editorial mode<br/><span className="text-green-400">● Development / safe publishing</span></div>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex h-17 items-center gap-3 border-b border-[var(--border)] bg-[color:var(--background)]/90 px-4 backdrop-blur md:px-7">
          <button className="btn btn-secondary !p-2.5 lg:hidden" onClick={() => setOpen(true)}><Menu size={19}/></button>
          <div className="relative hidden max-w-lg flex-1 md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17}/><input className="input !pl-10" placeholder="Search content, sources and projects…" /></div>
          <div className="ml-auto flex items-center gap-2"><span className="hidden rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800 sm:inline">Development mode</span><ThemeToggle/><div className="grid h-10 w-10 place-items-center rounded-full bg-[#292c27] text-sm font-bold text-white">A</div></div>
        </header>
        <div className="mx-auto max-w-[1500px] p-4 md:p-7">{children}</div>
      </main>
    </div>
  );
}
