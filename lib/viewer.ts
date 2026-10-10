import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import type { User } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/types";

/**
 * Per-request cached auth + profile lookups for Server Components.
 * React `cache()` dedups these across layout + page + components within
 * a single render — previously each issued its own getUser()/profile query,
 * stacking sequential round-trips on every dashboard navigation.
 */

export const getSessionUser = cache(async (): Promise<User | null> => {
  // Fast path: middleware already validated the session and stamped the user
  // id (x-user-id). Skips a duplicate Auth-server round-trip on every RSC/API
  // call. Falls through to getUser() when the header is absent (e.g. requests
  // that bypassed the middleware auth block).
  try {
    const stampedId = (await headers()).get("x-user-id");
    if (stampedId) return { id: stampedId } as User;
  } catch {
    // Not in request scope — fall through to getUser().
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getViewerProfile = cache(async (userId: string): Promise<UserProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  return (data as UserProfile | null) ?? null;
});

export const getViewer = cache(async (): Promise<{ user: User; profile: UserProfile | null } | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const profile = await getViewerProfile(user.id);
  return { user, profile };
});

const DASHBOARD_BY_ROLE: Record<string, string> = {
  caster: "/dashboard/caster",
  company: "/dashboard/company",
  admin: "/dashboard/admin",
};

/** Page guard for caster/company dashboards. Redirects logged-out users to /login. */
export async function requireRole(allowed: UserRole[]): Promise<{ user: User; profile: UserProfile | null }> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const role = viewer.profile?.role;
  if (!role || !allowed.includes(role)) {
    redirect(role && DASHBOARD_BY_ROLE[role] ? DASHBOARD_BY_ROLE[role] : "/");
  }
  return viewer;
}

/**
 * Page/layout guard for /dashboard/admin/*.
 * Admin pages use the service-role client (bypass RLS), so this server-side
 * check is load-bearing — it replaces the middleware role query.
 */
export async function requireAdminPage(): Promise<{ user: User; role: "admin" }> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  // getViewerProfile already selects suspension flags — no second query needed.
  const p = viewer.profile;
  if (!p || p.role !== "admin" || p.is_suspended || p.is_banned) {
    redirect("/");
  }
  return { user: viewer.user, role: "admin" as const };
}
