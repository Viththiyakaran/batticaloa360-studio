"use client";

import NextImage from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileImage, FileText, History, LoaderCircle, Search } from "lucide-react";
import { currentVersions, imageWorkflowMetadata, isEditorialStatus, statusLabel, type EditorialStatus } from "@/lib/editorial/workflow";
import { formatDate } from "@/lib/utils";

type Post = {id:string;news_item_id:string|null;platform:string;title:string|null;body:string;metadata:Record<string,unknown>|null;version:number;workflow_status:string;created_at:string;updated_at:string};
type Image = {id:string;news_item_id:string|null;public_url:string|null;template:string;width:number;height:number;metadata:Record<string,unknown>;created_at:string};
type Asset = {kind:"post"|"image";id:string;title:string;summary:string;status:string;version:number;updatedAt:string;previewUrl?:string|null;platform?:string;seriesKey:string};

async function json<T>(url:string):Promise<T> { const response=await fetch(url);const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||"Request failed.");return body; }
function editorialStatus(value:string):EditorialStatus { return isEditorialStatus(value)?value:"draft"; }

export function LibraryWorkspace() {
  const posts = useQuery({queryKey:["posts","history"],queryFn:()=>json<{posts:Post[]}>("/api/posts?includeHistory=true")});
  const images = useQuery({queryKey:["images","history"],queryFn:()=>json<{images:Image[]}>("/api/images?includeHistory=true")});
  const [query,setQuery] = useState("");
  const [kind,setKind] = useState("all");
  const [status,setStatus] = useState("all");

  const assets = useMemo(() => {
    const postRows = posts.data?.posts ?? [];
    const currentPosts = currentVersions(postRows);
    const postAssets:Asset[] = currentPosts.map((post) => ({kind:"post",id:post.id,title:post.title||"Untitled draft",summary:post.body,status:isEditorialStatus(post.workflow_status)?post.workflow_status:"draft",version:post.version,updatedAt:post.updated_at,platform:post.platform,seriesKey:`post:${post.news_item_id}:${post.platform}`}));
    const imageRows = (images.data?.images ?? []).map((image) => ({...image,metadata:imageWorkflowMetadata(image.metadata)}));
    const currentImages = new Map<string,(typeof imageRows)[number]>();
    for (const image of imageRows) { const key=typeof image.metadata.seriesId==="string"?image.metadata.seriesId:image.id;const saved=currentImages.get(key);if(!saved||Number(image.metadata.version)>Number(saved.metadata.version))currentImages.set(key,image); }
    const imageAssets:Asset[] = [...currentImages.entries()].map(([seriesKey,image]) => ({kind:"image",id:image.id,title:typeof image.metadata.headline==="string"&&image.metadata.headline?image.metadata.headline:`${image.template} image`,summary:`${image.template} · ${image.width} × ${image.height}`,status:String(image.metadata.workflowStatus),version:Number(image.metadata.version),updatedAt:image.created_at,previewUrl:image.public_url,seriesKey:`image:${seriesKey}`}));
    return [...postAssets,...imageAssets].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  },[posts.data,images.data]);
  const visible = assets.filter((asset) => (kind==="all"||asset.kind===kind)&&(status==="all"||asset.status===status)&&`${asset.title} ${asset.summary}`.toLowerCase().includes(query.toLowerCase()));
  if (posts.isLoading||images.isLoading) return <div className="card p-10 text-center"><LoaderCircle className="spin mx-auto mb-2"/>Loading persistent content library…</div>;
  const error=posts.error||images.error;
  if(error)return <div className="card p-5 text-red-600">{error.message}</div>;
  return <>
    <div className="card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_190px_210px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17}/><input className="input !pl-10" placeholder="Search captions, articles and images…" value={query} onChange={(event)=>setQuery(event.target.value)}/></div><select className="input" value={kind} onChange={(event)=>setKind(event.target.value)}><option value="all">All asset types</option><option value="post">Captions & articles</option><option value="image">Images</option></select><select className="input" value={status} onChange={(event)=>setStatus(event.target.value)}><option value="all">All workflow states</option><option value="draft">Draft</option><option value="ready_for_review">Ready for review</option><option value="approved">Approved</option><option value="archived">Archived</option></select></div>
    {visible.length===0?<div className="card p-10 text-center text-sm text-[var(--muted)]">No persistent assets match these filters.</div>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((asset)=><AssetCard key={asset.seriesKey} asset={asset} posts={posts.data?.posts??[]} images={images.data?.images??[]}/>)}</div>}
  </>;
}

function AssetCard({asset,posts,images}:{asset:Asset;posts:Post[];images:Image[]}) {
  const versions=asset.kind==="post"?posts.filter((post)=>`post:${post.news_item_id}:${post.platform}`===asset.seriesKey).sort((a,b)=>b.version-a.version):images.filter((image)=>{const metadata=imageWorkflowMetadata(image.metadata);return `image:${typeof metadata.seriesId==="string"?metadata.seriesId:image.id}`===asset.seriesKey;}).sort((a,b)=>Number(imageWorkflowMetadata(b.metadata).version)-Number(imageWorkflowMetadata(a.metadata).version));
  return <article className="card overflow-hidden">{asset.kind==="image"?(asset.previewUrl?<NextImage src={asset.previewUrl} alt="Saved Batticaloa360 graphic" width={640} height={360} unoptimized className="aspect-video w-full object-cover"/>:<div className="grid aspect-video place-items-center bg-neutral-100"><FileImage/></div>):null}<div className="p-5"><div className="mb-3 flex items-center justify-between gap-2"><span className="badge bg-[var(--accent-soft)] text-[#d85312]">{asset.platform??asset.kind}</span>{asset.kind==="post"?<FileText className="text-[var(--muted)]"/>:<FileImage className="text-[var(--muted)]"/>}</div><h2 className="font-black" lang="ta">{asset.title}</h2><p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-[var(--muted)]" lang="ta">{asset.summary}</p><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]"><span className="badge bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{statusLabel(editorialStatus(asset.status))}</span><span>v{asset.version}</span><span>·</span><span>{formatDate(asset.updatedAt)}</span></div><details className="mt-4 border-t border-[var(--border)] pt-3"><summary className="flex cursor-pointer items-center gap-2 text-sm font-bold"><History size={15}/>Version history ({versions.length})</summary><ol className="mt-3 space-y-2">{versions.map((version)=><li key={version.id} className="rounded-lg bg-[var(--background)] p-2 text-xs"><b>Version {asset.kind==="post"?(version as Post).version:String(imageWorkflowMetadata((version as Image).metadata).version)}</b><span className="ml-2 text-[var(--muted)]">{asset.kind==="post"?statusLabel(editorialStatus((version as Post).workflow_status)):statusLabel(imageWorkflowMetadata((version as Image).metadata).workflowStatus)} · {formatDate(asset.kind==="post"?(version as Post).updated_at:(version as Image).created_at)}</span></li>)}</ol></details></div></article>;
}
