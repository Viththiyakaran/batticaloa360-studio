import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ContentGenerator } from "@/components/content-generator";
export default function ContentPage(){return <><PageHeader eyebrow="AI-assisted editing" title="Content Generator" description="Draft grounded Tamil captions and articles, edit every word, then save for review."/><Suspense fallback={<div className="card p-8">Loading editor…</div>}><ContentGenerator/></Suspense></>}
