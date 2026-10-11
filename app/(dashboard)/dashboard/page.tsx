import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { PageHeader } from "@/components/page-header";

export default function Dashboard() {
  return (
    <>
      <PageHeader eyebrow="Editorial command centre" title="Dashboard" description="Live newsroom totals and the latest stories saved in Supabase." />
      <DashboardWorkspace />
    </>
  );
}
