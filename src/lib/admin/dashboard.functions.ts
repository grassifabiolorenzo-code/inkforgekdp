import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";
import type { AdminRole } from "@/lib/adminRbac";
import { memoize } from "@/lib/memoCache.server";

/** KPI/analytics sono metriche di business globali (non per-viewer): una cache breve
 * riduce il carico sul DB per admin diversi che aprono la dashboard nella stessa finestra
 * di tempo, senza percettibile perdita di "tempo reale" per una dashboard di KPI. */
const DASHBOARD_CACHE_TTL_SECONDS = 30;

/** Chi sono io (ruolo admin + email), usato dallo shell /admin per mostrare profilo/permessi. */
export const getMyAdminIdentity = createServerFn({ method: "GET" })
  .middleware([requirePermission("system", "read")])
  .handler(async ({ context }) => ({
    role: context.adminRole as AdminRole,
    email: context.adminEmail as string | null,
    userId: context.userId as string,
  }));

const rangeInput = z.object({ days: z.number().int().min(1).max(365).default(30) });

export interface AdminDashboardKpis {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  trial_ending_7d: number;
  cancelled_subscriptions: number;
  past_due_subscriptions: number;
  free_users: number;
  paying_users: number;
  mrr: number;
  failed_payments_30d: number;
  revenue_30d: number;
}

export interface AdminActiveUsers {
  dau: number;
  wau: number;
  mau: number;
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requirePermission("analytics", "read")])
  .inputValidator((data: unknown) => rangeInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    return memoize(`admin-dashboard:${data.days}`, DASHBOARD_CACHE_TTL_SECONDS, async () => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const [kpis, usersGrowth, revenue, planDistribution, subEvents, activeUsers] =
        await Promise.all([
          supabaseAdmin.rpc("admin_dashboard_kpis"),
          supabaseAdmin.rpc("admin_users_growth", { _days: data.days }),
          supabaseAdmin.rpc("admin_revenue_series", { _days: data.days }),
          supabaseAdmin.rpc("admin_plan_distribution"),
          supabaseAdmin.rpc("admin_subscription_events_series", { _days: data.days }),
          supabaseAdmin.rpc("admin_active_users_counts"),
        ]);

      if (kpis.error) throw new Error(kpis.error.message);

      return {
        kpis: kpis.data as unknown as AdminDashboardKpis,
        usersGrowth: usersGrowth.data ?? [],
        revenue: revenue.data ?? [],
        planDistribution: planDistribution.data ?? [],
        subscriptionEvents: subEvents.data ?? [],
        activeUsers: (activeUsers.data as unknown as AdminActiveUsers) ?? {
          dau: 0,
          wau: 0,
          mau: 0,
        },
      };
    });
  });

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requirePermission("analytics", "read")])
  .handler(async () => {
    return memoize("admin-analytics", DASHBOARD_CACHE_TTL_SECONDS, async () => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.rpc("admin_analytics_summary");
      if (error) throw new Error(error.message);
      return data as {
        arpu: number;
        trial_to_paid_30d: { trials_started: number; converted: number };
        churn_30d: number;
      };
    });
  });
