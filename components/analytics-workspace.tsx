"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileImage, FileText, LoaderCircle, Newspaper } from "lucide-react";

type DashboardData = { stats: { news: number; unverified: number; drafts: number; images: number; published: number } };

async function loadAnalytics(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Unable to load analytics.");
  return body;
}

export function AnalyticsWorkspace() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: loadAnalytics });
  if (query.isLoading) return <div className="card p-12 text-center"><LoaderCircle className="spin mx-auto mb-2" />Loading live analytics…</div>;
  if (query.error) return <div className="card p-5 text-red-600">{query.error.message}</div>;

  const stats = query.data!.stats;
  const metrics = [
    ["Saved stories", stats.news, Newspaper],
    ["Draft posts", stats.drafts, FileText],
    ["Saved images", stats.images, FileImage],
    ["Published items", stats.published, CheckCircle2],
  ] as const;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <div className="card p-5" key={label}>
            <Icon className="mb-4 text-[#f26a21]" />
            <div className="text-sm text-[var(--muted)]">{label}</div>
            <div className="my-2 text-3xl font-black">{value}</div>
            <div className="text-xs font-bold text-[var(--muted)]">Live from Supabase</div>
          </div>
        ))}
      </div>
      <div className="card mt-5 p-6">
        <h2 className="font-black">Editorial status</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {stats.unverified} saved {stats.unverified === 1 ? "story is" : "stories are"} awaiting verification.
          AI cost tracking will appear after provider usage logging is connected.
        </p>
      </div>
    </>
  );
}
