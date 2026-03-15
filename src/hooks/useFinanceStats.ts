import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FinanceStats {
  totalThisMonth: number;
  totalYear: number;
  uniqueDonors: number;
  averageDonation: number;
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
}

export default function useFinanceStats(days = 30) {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

        const [{ data: monthData, error: monthError }, { data: yearData, error: yearError }] =
          await Promise.all([
            supabase
              .from("donations")
              .select("id, amount, payment_method, payment_status, user_id")
              .eq("payment_status", "completed")
              .gte("created_at", monthStart),
            supabase
              .from("donations")
              .select("id, amount, payment_method, payment_status, user_id")
              .eq("payment_status", "completed")
              .gte("created_at", yearStart),
          ]);

        if (monthError) throw monthError;
        if (yearError) throw yearError;

        const totalThisMonth =
          monthData?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) ?? 0;
        const totalYear =
          yearData?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) ?? 0;

        const donorSet = new Set<string>();
        yearData?.forEach((d) => {
          if (d.user_id) donorSet.add(String(d.user_id));
        });

        const uniqueDonors = donorSet.size;
        const averageDonation =
          yearData && yearData.length > 0
            ? totalYear / yearData.length
            : 0;

        const byMethod: Record<string, number> = {};
        const byStatus: Record<string, number> = {};

        yearData?.forEach((d) => {
          const method = d.payment_method || "unknown";
          const status = d.payment_status || "unknown";
          const amt = Number(d.amount) || 0;

          byMethod[method] = (byMethod[method] || 0) + amt;
          byStatus[status] = (byStatus[status] || 0) + amt;
        });

        if (mounted) {
          setStats({
            totalThisMonth,
            totalYear,
            uniqueDonors,
            averageDonation,
            byMethod,
            byStatus,
          });
        }
      } catch {
        if (mounted) setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [days]);

  return { stats, loading } as const;
}

