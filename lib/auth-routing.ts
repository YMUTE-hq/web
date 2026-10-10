/**
 * Centralized Role-to-Dashboard URL routing table.
 * Provides a single source of truth for post-login and role-based redirects.
 */
export type AppRole = "caster" | "company" | "admin" | "user";

export function getDashboardUrlForRole(role?: string | null): string {
  switch (role) {
    case "caster":
      return "/dashboard/caster";
    case "company":
      return "/dashboard/company";
    case "admin":
      return "/dashboard/admin";
    case "user":
      return "/";
    default:
      return "/dashboard";
  }
}
