import { LibraryWorkspace } from "@/components/library-workspace";
import { PageHeader } from "@/components/page-header";

export default function Library() {
  return (
    <>
      <PageHeader eyebrow="Editorial records" title="Content Library" description="Saved post drafts and generated images from Supabase." />
      <LibraryWorkspace />
    </>
  );
}
