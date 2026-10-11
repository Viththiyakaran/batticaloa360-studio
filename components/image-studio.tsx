"use client";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, History, ImagePlus, LoaderCircle, Save, Send, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { isEditorialStatus, statusLabel, type EditorialStatus } from "@/lib/editorial/workflow";
import { categories } from "@/lib/types";

const sizes = {square:[1080,1080],portrait:[1080,1350],story:[1080,1920],blogger:[1200,630]} as const;
const templates = {Breaking:["#8c170e","#ef4b2f"],General:["#153438","#347c75"],Politics:["#30124d","#8547a8"],Education:["#0d3e68","#2e82ca"],Jobs:["#18462e","#4a9e69"],History:["#56361f","#b6814b"],Tourism:["#075a73","#22a8b7"],Temple:["#6c260d","#ed8a25"],Food:["#63213a","#d25771"],Community:["#26364d","#597caa"]} as const;
type Template = keyof typeof templates;
type Format = keyof typeof sizes;
type Story = {id:string;headline:string;summary:string|null;category_name:string};
type SavedImage = {id:string;news_item_id:string|null;public_url:string|null;template:string;width:number;height:number;metadata:Record<string,unknown>;created_at:string};
type GenerationType = "procedural"|"licensed_photo"|"gemini";
type ImageDraft = {seriesId:string;headline:string;category:string;template:Template;format:Format;fontSize:number;imagePrompt:string;generationType:GenerationType};

async function json<T>(input:RequestInfo, init?:RequestInit):Promise<T> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

export function ImageStudio() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();
  const stories = useQuery({ queryKey:["news-items"], queryFn:() => json<{items:Story[]}>("/api/news-items") });
  const [newsItemId,setNewsItemId] = useState("");
  const selectedNewsItemId = newsItemId || stories.data?.items[0]?.id || "";
  const selectedStory = stories.data?.items.find((story) => story.id === selectedNewsItemId);
  const images = useQuery({ queryKey:["images",selectedNewsItemId], enabled:Boolean(selectedNewsItemId), queryFn:() => json<{images:SavedImage[]}>(`/api/images?newsItemId=${encodeURIComponent(selectedNewsItemId)}`) });
  const currentImage = images.data?.images[0];
  const metadata = currentImage?.metadata ?? {};
  const persistedDraft:ImageDraft = {
    seriesId:typeof metadata.seriesId === "string" ? metadata.seriesId : "",
    headline:typeof metadata.headline === "string" ? metadata.headline : selectedStory?.headline ?? "தமிழ் தலைப்பை இங்கே எழுதுங்கள்",
    category:typeof metadata.category === "string" ? metadata.category : selectedStory?.category_name || "செய்திகள்",
    template:currentImage?.template && currentImage.template in templates ? currentImage.template as Template : "General",
    format:typeof metadata.format === "string" && metadata.format in sizes ? metadata.format as Format : "square",
    fontSize:typeof metadata.fontSize === "number" ? metadata.fontSize : 76,
    imagePrompt:typeof metadata.imagePrompt === "string" ? metadata.imagePrompt : selectedStory?.summary || selectedStory?.headline || "",
    generationType:metadata.generationType === "gemini" || metadata.generationType === "licensed_photo" ? metadata.generationType : "procedural",
  };
  const [draftEdit,setDraftEdit] = useState<{key:string;value:ImageDraft}|null>(null);
  const draft = draftEdit?.key === selectedNewsItemId ? draftEdit.value : persistedDraft;
  const {seriesId,headline,category,template,format,fontSize,imagePrompt,generationType} = draft;
  function updateDraft(update:Partial<ImageDraft>) { setDraftEdit({key:selectedNewsItemId,value:{...draft,...update}}); }
  const [photo,setPhoto] = useState<HTMLImageElement|null>(null);
  const [notice,setNotice] = useState("");
  const [saving,setSaving] = useState(false);
  const [generating,setGenerating] = useState(false);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const [width,height] = sizes[format];
    element.width = width;
    element.height = height;
    const context = element.getContext("2d");
    if (!context) return;
    const [start,end] = templates[template];
    const gradient = context.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,start);
    gradient.addColorStop(1,end);
    context.fillStyle = gradient;
    context.fillRect(0,0,width,height);
    if (photo) {
      context.save(); context.globalAlpha = .6;
      const scale = Math.max(width/photo.width,height/photo.height);
      context.drawImage(photo,(width-photo.width*scale)/2,(height-photo.height*scale)/2,photo.width*scale,photo.height*scale);
      context.restore();
    }
    context.fillStyle = "rgba(0,0,0,.34)"; context.fillRect(0,0,width,height);
    context.fillStyle = "#f26a21"; context.fillRect(0,0,18,height);
    context.fillStyle = "rgba(255,255,255,.16)"; context.fillRect(70,70,Math.min(320,width-140),58);
    context.fillStyle = "#fff"; context.font = "700 28px Arial"; context.fillText(category,95,109);
    context.textBaseline = "top"; context.font = `800 ${fontSize}px Noto Sans Tamil, Nirmala UI, Arial`;
    wrapText(context,headline,70,height*.34,width-140,fontSize*1.38);
    drawBrandLogo(context,70,height-132);
    const disclosure = generationType === "gemini" ? "AI-generated background - Editorial review required" : generationType === "licensed_photo" ? "Licensed photograph - Editorial review required" : "AI-assisted illustration - Editorial review required";
    context.font = "500 23px Arial"; context.fillStyle = "rgba(255,255,255,.8)"; context.fillText(disclosure,70,height-52);
  }, [headline,category,template,format,fontSize,photo,generationType]);

  function upload(file?:File) { if (!file) return; const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => { setPhoto(image); updateDraft({generationType:"licensed_photo"}); URL.revokeObjectURL(url); }; image.onerror = () => { setNotice("The selected image could not be loaded."); URL.revokeObjectURL(url); }; image.src = url; }
  async function generateImage() {
    if (!imagePrompt.trim()) { setNotice("Enter a visual caption before generating an image."); return; }
    setGenerating(true); setNotice("");
    try {
      const response = await fetch("/api/generate-image", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({caption:imagePrompt,headline,category,format}) });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "Gemini image generation failed."); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const image = new Image();
      await new Promise<void>((resolve,reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Gemini returned an unreadable image.")); image.src = url; });
      setPhoto(image); updateDraft({generationType:"gemini"}); URL.revokeObjectURL(url);
      setNotice("Gemini background generated. Review it, then save a version to persist the branded image.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Gemini image generation failed."); }
    finally { setGenerating(false); }
  }
  function download(kind:"png"|"jpeg") { const element = canvas.current; if (!element) return; const anchor = document.createElement("a"); anchor.href = element.toDataURL(`image/${kind}`,.92); anchor.download = `batticaloa360-${Date.now()}.${kind === "jpeg" ? "jpg" : "png"}`; anchor.click(); setNotice("Image downloaded."); }
  async function save() {
    const element = canvas.current;
    if (!element || !selectedNewsItemId) return;
    setSaving(true); setNotice("");
    const blob = await new Promise<Blob|null>((resolve) => element.toBlob(resolve,"image/png"));
    if (!blob) { setSaving(false); return; }
    const [width,height] = sizes[format];
    const form = new FormData();
    form.set("file",blob,"batticaloa360.png"); form.set("newsItemId",selectedNewsItemId); if (seriesId) form.set("seriesId",seriesId);
    form.set("template",template); form.set("width",String(width)); form.set("height",String(height)); form.set("headline",headline); form.set("category",category); form.set("format",format); form.set("fontSize",String(fontSize)); form.set("prompt",imagePrompt); form.set("generationType",generationType);
    try {
      const body = await json<{image:SavedImage}>("/api/images",{method:"POST",body:form});
      if (typeof body.image.metadata.seriesId === "string") updateDraft({seriesId:body.image.metadata.seriesId});
      setNotice(`Image version ${body.image.metadata.version} saved to Supabase Storage.`);
      queryClient.invalidateQueries({queryKey:["images"]});
    } catch (error) { setNotice(error instanceof Error ? error.message : "Save failed."); }
    finally { setSaving(false); }
  }
  const transition = useMutation({
    mutationFn:(workflowStatus:EditorialStatus) => json<{image:SavedImage}>(`/api/images/${currentImage?.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({workflowStatus})}),
    onSuccess:(body) => { setNotice(`Image version ${body.image.metadata.version} moved to ${statusLabel(body.image.metadata.workflowStatus as EditorialStatus)}.`); queryClient.invalidateQueries({queryKey:["images"]}); },
    onError:(error) => setNotice(error.message),
  });
  const status = currentImage && isEditorialStatus(currentImage.metadata.workflowStatus) ? currentImage.metadata.workflowStatus : "draft";

  if (stories.isLoading) return <div className="card p-10 text-center"><LoaderCircle className="spin mx-auto mb-2"/>Loading saved stories…</div>;
  if (!selectedStory) return <div className="card p-10 text-center">Import a story before creating an image.</div>;
  return <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
    <aside className="card h-fit space-y-4 p-5">
      <div><label className="mb-1.5 block text-sm font-black">Source story</label><select className="input" value={selectedNewsItemId} onChange={(event) => { setNewsItemId(event.target.value); setPhoto(null); setNotice(""); }}>{stories.data?.items.map((story) => <option key={story.id} value={story.id}>{story.headline}</option>)}</select></div>
      <div><label className="mb-1.5 block text-sm font-black">Tamil headline</label><textarea className="input min-h-28 leading-7" lang="ta" value={headline} onChange={(event) => updateDraft({headline:event.target.value})}/></div>
      <div><label className="mb-1.5 block text-sm font-black">Visual caption / Gemini brief</label><textarea className="input min-h-24 leading-6" value={imagePrompt} onChange={(event) => updateDraft({imagePrompt:event.target.value})} placeholder="Describe the scene Gemini should illustrate from this story."/><p className="mt-1 text-xs text-[var(--muted)]">Gemini creates only the background; the Tamil headline and Batticaloa360 logo are added accurately by the studio.</p></div>
      <div><label className="mb-1.5 block text-sm font-black">Category</label><select className="input" value={category} onChange={(event) => updateDraft({category:event.target.value})}>{categories.map((value) => <option key={value}>{value}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-sm font-black">Template</label><select className="input" value={template} onChange={(event) => updateDraft({template:event.target.value as Template})}>{Object.keys(templates).map((value) => <option key={value}>{value}</option>)}</select></div><div><label className="mb-1.5 block text-sm font-black">Format</label><select className="input" value={format} onChange={(event) => updateDraft({format:event.target.value as Format})}><option value="square">1080 × 1080</option><option value="portrait">1080 × 1350</option><option value="story">1080 × 1920</option><option value="blogger">1200 × 630</option></select></div></div>
      <div><div className="mb-1.5 flex justify-between text-sm font-black"><label>Headline size</label><span>{fontSize}px</span></div><input className="w-full accent-[#f26a21]" type="range" min="44" max="104" value={fontSize} onChange={(event) => updateDraft({fontSize:Number(event.target.value)})}/></div>
      <label className="btn btn-secondary w-full"><Upload size={17}/>Upload licensed photograph<input className="hidden" type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])}/></label>
      <button className="btn btn-primary w-full" disabled={generating || !imagePrompt.trim()} onClick={generateImage}>{generating ? <LoaderCircle className="spin" size={17}/> : <Sparkles size={17}/>}Generate with Gemini</button>
      <button className="btn btn-secondary w-full" onClick={() => {setPhoto(null);updateDraft({generationType:"procedural"});setNotice("Procedural background restored.");}}>Use procedural background</button>
      <p className="text-xs leading-5 text-[var(--muted)]">Tamil is rendered separately with Unicode shaping. Illustrations are labelled to avoid resembling event photography.</p>
      {currentImage && <div className="rounded-xl border border-[var(--border)] p-3 text-sm"><div className="flex items-center gap-2 font-black"><History size={15}/>Saved version {String(currentImage.metadata.version)}</div><div className="mt-1 text-xs text-[var(--muted)]">{statusLabel(status)} · restored from Supabase</div></div>}
    </aside>
    <section className="card p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black">Live composition</h2><p className="text-sm text-[var(--muted)]">Export-ready at the selected native resolution.</p></div><div className="flex flex-wrap gap-2"><button className="btn btn-secondary" disabled={saving} onClick={save}>{saving ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>}Save version</button><button className="btn btn-secondary" onClick={() => download("jpeg")}><ImagePlus size={16}/>JPG</button><button className="btn btn-primary" onClick={() => download("png")}><Download size={16}/>PNG</button></div></div>
      <div className="grid min-h-[540px] place-items-center overflow-hidden rounded-xl bg-neutral-200 p-3 dark:bg-neutral-900"><canvas ref={canvas} className="max-h-[720px] max-w-full rounded-lg shadow-2xl" aria-label="Generated Batticaloa360 image preview"/></div>
      {currentImage?.public_url && <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] p-3"><NextImage src={currentImage.public_url} alt="Most recently saved composition" width={96} height={96} unoptimized className="h-20 w-20 rounded-lg object-cover"/><div><b>Persisted production asset</b><p className="text-xs text-[var(--muted)]">Available again after refresh or sign-in.</p></div></div>}
      {currentImage && <div className="mt-4 flex flex-wrap gap-2">{status === "draft" && <button className="btn btn-secondary" onClick={() => transition.mutate("ready_for_review")}><Send size={16}/>Submit for review</button>}{status === "ready_for_review" && <><button className="btn btn-secondary" onClick={() => transition.mutate("draft")}>Return to draft</button><button className="btn btn-primary" onClick={() => transition.mutate("approved")}><ShieldCheck size={16}/>Approve image</button></>}{status === "approved" && <button className="btn btn-secondary" onClick={() => transition.mutate("ready_for_review")}>Reopen review</button>}{status !== "archived" && <button className="btn btn-secondary" onClick={() => transition.mutate("archived")}>Archive</button>}{status === "archived" && <button className="btn btn-secondary" onClick={() => transition.mutate("draft")}>Restore draft</button>}</div>}
      {notice && <p className="mt-3 flex items-center gap-2 text-sm font-bold" role="status"><Check size={16}/>{notice}</p>}
    </section>
  </div>;
}

function wrapText(context:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number) { const words=text.split(/\s+/);let line="";const lines:string[]=[];for(const word of words){const test=line?`${line} ${word}`:word;if(context.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);lines.slice(0,5).forEach((value,index)=>context.fillText(value,x,y+index*lineHeight)); }

function drawBrandLogo(context:CanvasRenderingContext2D,x:number,y:number) {
  context.save();
  context.fillStyle = "#f26a21";
  roundedRect(context,x,y,62,62,14);
  context.fill();
  context.fillStyle = "#fff"; context.textBaseline = "top"; context.font = "900 30px Arial"; context.fillText("B",x+19,y+7);
  context.font = "800 13px Arial"; context.fillText("360",x+18,y+42);
  context.font = "800 30px Arial"; context.fillText("Batticaloa360",x+78,y+15);
  context.restore();
}

function roundedRect(context:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,radius:number) {
  const r = Math.min(radius,width/2,height/2);
  context.beginPath(); context.moveTo(x+r,y); context.arcTo(x+width,y,x+width,y+height,r); context.arcTo(x+width,y+height,x,y+height,r); context.arcTo(x,y+height,x,y,r); context.arcTo(x,y,x+width,y,r); context.closePath();
}
