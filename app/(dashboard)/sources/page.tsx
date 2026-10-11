import { PageHeader } from "@/components/page-header";
import { SourceManager } from "@/components/source-manager";
export default function SourcesPage(){return <><PageHeader eyebrow="Discovery configuration" title="News Sources" description="Manage permitted RSS feeds and public websites. Facebook scraping and access-restriction bypasses are not supported."/><SourceManager/></>}
