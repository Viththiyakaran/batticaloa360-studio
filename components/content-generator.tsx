"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clipboard, FileText, History, LoaderCircle, RotateCcw, Save, Send, ShieldCheck, Sparkles } from "lucide-react";
import { isEditorialStatus, statusLabel, type EditorialStatus } from "@/lib/editorial/workflow";
import type { NewsItem } from "@/lib/types";

type DbItem = { id:string; headline:string; source_url:string; summary:string|null; published_at:string|null; discovered_at:string; category_name:string; verification_status:"unverified"|"verified"|"outdated"|"unverifiable"; raw_metadata:Record<string,unknown>|null };
type Caption = { headline:string; caption:string; hashtags:string[]; question:string };
type Article = { title:string; introduction:string; sections:{heading:string;body:string}[]; attribution:string; labels:string[]; searchDescription:string };
type Post = { id:string; news_item_id:string|null; platform:"facebook"|"blogger"; title:string|null; body:string; metadata:Record<string,unknown>|null; version:number; workflow_status:string; updated_at:string };

async function json<T>(input:RequestInfo, init?:RequestInit):Promise<T> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

function restoreCaption(post:Post):Caption {
  const saved = post.metadata?.editorContent;
  if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved as Caption;
  return { headline:post.title ?? "", caption:post.body, hashtags:[], question:"" };
}

function restoreArticle(post:Post):Article {
  const saved = post.metadata?.editorContent;
  if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved as Article;
  return { title:post.title ?? "", introduction:post.body, sections:[], attribution:"", labels:[], searchDescription:"" };
}

export function ContentGenerator() {
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const requested = search.get("news");
  const stories = useQuery({ queryKey:["news-items"], queryFn:() => json<{items:DbItem[]}>("/api/news-items") });
  const [itemId, setItemId] = useState(requested ?? "");
  const [tab, setTab] = useState<"caption"|"article">("caption");
  const [mode, setMode] = useState("");
  const [notice, setNotice] = useState("");
  const [captionEdit, setCaptionEdit] = useState<{key:string;value:Caption}|null>(null);
  const [articleEdit, setArticleEdit] = useState<{key:string;value:Article}|null>(null);
  const effectiveItemId = itemId || stories.data?.items[0]?.id || "";
  const platform = tab === "caption" ? "facebook" : "blogger";
  const drafts = useQuery({
    queryKey:["posts", effectiveItemId, platform],
    enabled:Boolean(effectiveItemId),
    queryFn:() => json<{posts:Post[]}>(`/api/posts?newsItemId=${encodeURIComponent(effectiveItemId)}&platform=${platform}`),
  });
  const currentPost = drafts.data?.posts[0];
  const captionKey = `${effectiveItemId}:facebook`;
  const articleKey = `${effectiveItemId}:blogger`;
  const caption = captionEdit?.key === captionKey ? captionEdit.value : currentPost?.platform === "facebook" ? restoreCaption(currentPost) : null;
  const article = articleEdit?.key === articleKey ? articleEdit.value : currentPost?.platform === "blogger" ? restoreArticle(currentPost) : null;
  function setCaption(value:Caption|null) { setCaptionEdit(value ? {key:captionKey,value} : null); }
  function setArticle(value:Article|null) { setArticleEdit(value ? {key:articleKey,value} : null); }

  const dbItem = useMemo(() => stories.data?.items.find((candidate) => candidate.id === effectiveItemId), [stories.data, effectiveItemId]);
  const item:NewsItem|undefined = dbItem ? {
    id:dbItem.id,
    headline:dbItem.headline,
    sourceName:typeof dbItem.raw_metadata?.source_name === "string" ? dbItem.raw_metadata.source_name : new URL(dbItem.source_url).hostname,
    sourceUrl:dbItem.source_url,
    publishedAt:dbItem.published_at,
    discoveredAt:dbItem.discovered_at,
    category:dbItem.category_name,
    summary:dbItem.summary ?? "",
    verificationStatus:dbItem.verification_status,
  } : undefined;

  const generate = useMutation({
    onMutate:() => setNotice(""),
    mutationFn:() => json<{mode:string;content:Caption|Article}>("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({type:tab,item}) }),
    onSuccess:(body) => { setMode(body.mode); if (tab === "caption") setCaption(body.content as Caption); else setArticle(body.content as Article); },
    onError:(error) => setNotice(error.message),
  });
  const fullCaption = caption ? `${caption.headline}\n\n${caption.caption}\n\n${caption.question}\n\n${caption.hashtags.join(" ")}` : "";
  const articleBody = article ? [article.introduction, ...article.sections.flatMap((section) => [section.heading, section.body]), article.attribution].filter(Boolean).join("\n\n") : "";
  const save = useMutation({
    mutationFn:() => json<{post:Post}>("/api/posts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
      newsItemId:effectiveItemId,
      platform,
      title:tab === "caption" ? caption?.headline : article?.title,
      body:tab === "caption" ? fullCaption : articleBody,
      metadata:{ editorContent:tab === "caption" ? caption : article, generatorMode:mode || "restored" },
    }) }),
    onSuccess:(body) => { setNotice(`Draft version ${body.post.version} saved to Supabase.`); queryClient.invalidateQueries({queryKey:["posts"]}); },
    onError:(error) => setNotice(error.message),
  });
  const transition = useMutation({
    mutationFn:(workflowStatus:EditorialStatus) => json<{post:Post}>(`/api/posts/${currentPost?.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({workflowStatus}) }),
    onSuccess:(body) => { setNotice(`Version ${body.post.version} moved to ${statusLabel(body.post.workflow_status as EditorialStatus)}.`); queryClient.invalidateQueries({queryKey:["posts"]}); },
    onError:(error) => setNotice(error.message),
  });

  async function copy() { await navigator.clipboard.writeText(fullCaption); setNotice("Complete caption copied to clipboard."); }
  function changeStory(id:string) { setItemId(id); setCaption(null); setArticle(null); setMode(""); setNotice(""); }
  function changeTab(next:"caption"|"article") { setTab(next); setNotice(""); }

  if (stories.isLoading) return <div className="card p-10 text-center"><LoaderCircle className="spin mx-auto mb-2"/>Loading saved stories…</div>;
  if (stories.error) return <div className="card p-5 text-red-600">{stories.error.message}</div>;
  if (!item) return <div className="card p-10 text-center"><FileText className="mx-auto mb-3 text-[#f26a21]"/><h2 className="font-black">No saved stories yet</h2><p className="text-sm text-[var(--muted)]">Import and verify a story in Latest News first.</p></div>;

  const currentStatus = currentPost && isEditorialStatus(currentPost.workflow_status) ? currentPost.workflow_status : "draft";
  return <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
    <aside className="card h-fit p-5">
      <label className="mb-2 block text-sm font-black">Saved source story</label>
      <select className="input mb-4" value={effectiveItemId} onChange={(event) => changeStory(event.target.value)}>{stories.data?.items.map((story) => <option key={story.id} value={story.id}>{story.headline}</option>)}</select>
      <div className="rounded-xl bg-[var(--accent-soft)] p-4"><span className="badge mb-2 bg-white text-[#d85312] dark:bg-neutral-900">{item.category}</span><h2 className="font-black" lang="ta">{item.headline}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]" lang="ta">{item.summary}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 block truncate text-xs font-bold text-[#f26a21]">{item.sourceName} ↗</a></div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Compare every generated claim with the linked source before approval.</div>
      {currentPost && <div className="mt-4 rounded-xl border border-[var(--border)] p-3 text-sm"><div className="flex items-center gap-2 font-black"><History size={15}/>Saved version {currentPost.version}</div><div className="mt-2 text-xs text-[var(--muted)]">{statusLabel(currentStatus)} · restored automatically after refresh or sign-in</div></div>}
    </aside>
    <section className="card overflow-hidden">
      <div className="flex border-b border-[var(--border)]"><button className={`flex-1 px-4 py-4 text-sm font-black ${tab === "caption" ? "border-b-2 border-[#f26a21] text-[#f26a21]" : "text-[var(--muted)]"}`} onClick={() => changeTab("caption")}>Facebook Caption</button><button className={`flex-1 px-4 py-4 text-sm font-black ${tab === "article" ? "border-b-2 border-[#f26a21] text-[#f26a21]" : "text-[var(--muted)]"}`} onClick={() => changeTab("article")}>Blogger Article</button></div>
      <div className="p-5 md:p-7">
        {mode && <div className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{mode === "mock" ? "Development mock - not AI-generated" : mode === "gemini" ? "Gemini generation" : "OpenAI generation"}</div>}
        {drafts.isLoading ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="spin"/></div> : tab === "caption" ? (caption ? <div className="space-y-4" lang="ta"><input className="input text-xl font-black" value={caption.headline} onChange={(event) => setCaption({...caption,headline:event.target.value})}/><textarea className="input min-h-44 leading-7" value={caption.caption} onChange={(event) => setCaption({...caption,caption:event.target.value})}/><input className="input" value={caption.question} onChange={(event) => setCaption({...caption,question:event.target.value})}/><input className="input" value={caption.hashtags.join(" ")} onChange={(event) => setCaption({...caption,hashtags:event.target.value.split(/\s+/)})}/></div> : <Empty type="caption"/>) : (article ? <div className="space-y-4" lang="ta"><input className="input text-xl font-black" value={article.title} onChange={(event) => setArticle({...article,title:event.target.value})}/><textarea className="input min-h-24 leading-7" value={article.introduction} onChange={(event) => setArticle({...article,introduction:event.target.value})}/>{article.sections.map((section,index) => <div key={index} className="rounded-xl border border-[var(--border)] p-4"><input className="input mb-3 font-black" value={section.heading} onChange={(event) => setArticle({...article,sections:article.sections.map((value,position) => position === index ? {...value,heading:event.target.value} : value)})}/><textarea className="input min-h-32 leading-7" value={section.body} onChange={(event) => setArticle({...article,sections:article.sections.map((value,position) => position === index ? {...value,body:event.target.value} : value)})}/></div>)}</div> : <Empty type="article"/>)}
        <div className="mt-6 flex flex-wrap gap-2"><button className="btn btn-primary" onClick={() => generate.mutate()} disabled={generate.isPending}>{generate.isPending ? <LoaderCircle className="spin" size={17}/> : caption || article ? <RotateCcw size={17}/> : <Sparkles size={17}/>}Generate {tab}</button>{tab === "caption" && caption && <button className="btn btn-secondary" onClick={copy}><Clipboard size={17}/>Copy caption</button>}<button className="btn btn-secondary" disabled={save.isPending || (!caption && !article)} onClick={() => save.mutate()}><Save size={17}/>Save new version</button></div>
        {currentPost && <div className="mt-3 flex flex-wrap gap-2">{currentStatus === "draft" && <button className="btn btn-secondary" onClick={() => transition.mutate("ready_for_review")} disabled={transition.isPending}><Send size={16}/>Submit for review</button>}{currentStatus === "ready_for_review" && <><button className="btn btn-secondary" onClick={() => transition.mutate("draft")} disabled={transition.isPending}><RotateCcw size={16}/>Return to draft</button><button className="btn btn-primary" onClick={() => transition.mutate("approved")} disabled={transition.isPending}><ShieldCheck size={16}/>Approve</button></>}{currentStatus === "approved" && <button className="btn btn-secondary" onClick={() => transition.mutate("ready_for_review")} disabled={transition.isPending}><RotateCcw size={16}/>Reopen review</button>}{currentStatus !== "archived" && <button className="btn btn-secondary" onClick={() => transition.mutate("archived")} disabled={transition.isPending}>Archive</button>}{currentStatus === "archived" && <button className="btn btn-secondary" onClick={() => transition.mutate("draft")} disabled={transition.isPending}>Restore draft</button>}</div>}
        {notice && <p className="mt-4 flex items-center gap-2 text-sm font-bold" role="status"><Check size={16}/>{notice}</p>}
      </div>
    </section>
  </div>;
}

function Empty({type}:{type:string}) { return <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-[var(--border)] text-center"><div><FileText className="mx-auto mb-3 text-[#f26a21]"/><h3 className="font-black">Ready to generate {type}</h3><p className="text-sm text-[var(--muted)]">Saved versions automatically return after refresh and sign-in.</p></div></div>; }
