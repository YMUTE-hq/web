/** Shared validation / sanitization helpers (backend + frontend safe). */

export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape PostgREST `or()` / `ilike` filter values: %, _, comma, parens, backslash, quotes. */
export function sanitizeIlike(value: string): string {
  return value.replace(/[\\%,_()"]/g, (c) => `\\${c}`).slice(0, 100);
}

export function clampLimit(raw: unknown, def = 20, max = 50): number {
  const n = typeof raw === "string" ? parseInt(raw, 10) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(1, Math.floor(n)), max);
}

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_REGEX.test(v);
}

/** Only allow same-origin app paths: `/foo`, never `//evil`, `http:`, `\\`. */
export function isSafeNextPath(next: unknown): next is string {
  return (
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\") &&
    !next.includes("://")
  );
}

export function isHttpUrl(v: unknown, maxLen = 2048): v is string {
  return (
    typeof v === "string" &&
    v.length > 0 &&
    v.length <= maxLen &&
    (v.startsWith("https://") || v.startsWith("http://"))
  );
}
