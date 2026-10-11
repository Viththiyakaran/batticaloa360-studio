import { AnalyticsWorkspace } from "@/components/analytics-workspace";
import { PageHeader } from "@/components/page-header";

export default function Analytics() {
  return (
    <>
      <PageHeader eyebrow="Performance & cost" title="Analytics" description="Live production volume and editorial workflow totals." />
      <AnalyticsWorkspace />
    </>
  );
}
