import { LibraryWorkspace } from "@/components/library-workspace";
import { PageHeader } from "@/components/page-header";

export default function Library() {
  return (
    <>
      <PageHeader eyebrow="Editorial records" title="Content Library" description="Search current captions, articles and images, inspect workflow status, and review every immutable Supabase version." />
      <LibraryWorkspace />
    </>
  );
}
