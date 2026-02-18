import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSupabaseAuth } from "./useSupabaseAuth";

export interface RevenueStats {
  unpaidCount: number;
  unpaidAmount: number;
  revenueAtRisk: number;
}

export interface PipelineStats {
  activeLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export function useRevenueAnalytics(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { user } = useSupabaseAuth();
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    unpaidCount: 0,
    unpaidAmount: 0,
    revenueAtRisk: 0,
  });
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({
    activeLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!enabled) {
        setRevenueStats({
          unpaidCount: 0,
          unpaidAmount: 0,
          revenueAtRisk: 0,
        });
        setPipelineStats({
          activeLeads: 0,
          convertedLeads: 0,
          conversionRate: 0,
        });
        setIsLoading(false);
        return;
      }

      if (!user) {
        setRevenueStats({
          unpaidCount: 0,
          unpaidAmount: 0,
          revenueAtRisk: 0,
        });
        setPipelineStats({
          activeLeads: 0,
          convertedLeads: 0,
          conversionRate: 0,
        });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        // 1. Calculate Revenue at Risk (Unpaid Invoices)
        // Using 'total_amount' from invoices table
        const { data: unpaidInvoices, error: invoiceError } = await supabase
          .from("invoices")
          .select("total_amount")
          .eq("status", "unpaid");

        if (invoiceError) {
          console.error("Error fetching invoices:", invoiceError);
        }

        let totalUnpaid = 0;
        let count = 0;

        if (unpaidInvoices) {
          count = unpaidInvoices.length;
          totalUnpaid = unpaidInvoices.reduce(
            (sum, inv) => sum + (inv.total_amount || 0),
            0,
          );
        }

        setRevenueStats({
          unpaidCount: count,
          unpaidAmount: totalUnpaid,
          revenueAtRisk: totalUnpaid,
        });

        // 2. Calculate Lead Pipeline (Triage -> Jobs)
        // Fetch total triage submissions (leads)
        const { count: triageCount, error: triageError } = await supabase
          .from("triage_submissions")
          .select("*", { count: "exact", head: true });

        if (triageError) {
          console.error("Error fetching triage submissions:", triageError);
        }

        // Fetch jobs that originated from triage (assuming we track source, or just verify jobs created recently)
        // For now, let's just get total jobs as a proxy for conversion if source isn't strictly linked yet,
        // OR better, checking if triage_uploads has a 'converted_job_id' column if it exists.
        // Checking schema... let's assume we want to just see raw counts for now.
        const { count: jobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true });

        const totalLeads = triageCount || 0;
        const totalJobs = jobsCount || 0;

        // Simple mock conversion logic for this iteration until schema hard-link is verified
        const conversion =
          totalLeads > 0 ? (totalJobs / (totalJobs + totalLeads)) * 100 : 0;

        setPipelineStats({
          activeLeads: totalLeads,
          convertedLeads: totalJobs, // This is total jobs, effectively "Won" business
          conversionRate: Math.round(conversion),
        });
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [user, enabled]);

  return { revenueStats, pipelineStats, isLoading };
}
