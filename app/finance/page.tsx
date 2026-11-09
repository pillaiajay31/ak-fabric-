import { FinanceDashboardClient } from "@/components/FinanceDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance & Tax Invoice Dashboard | KnitFlow",
  description:
    "Real-time GST tax invoice totals, job work charges, and delivery challan billing for A.K. Fabric Silvassa.",
};

export default function FinanceDashboardPage() {
  return <FinanceDashboardClient />;
}
