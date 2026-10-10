import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Never trust a client-sent identity header: strip it first. It is re-added
  // below ONLY after the session is validated (finalizeResponse).
  request.headers.delete("x-user-id");

  // ─── 1. CORS & CSRF Protection for API Routes ───
  if (path.startsWith("/api") && !path.startsWith("/api/auth/callback") && !path.startsWith("/api/webhooks")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const nextUrlOrigin = request.nextUrl.origin;
    const secFetchSite = request.headers.get("sec-fetch-site");

    let refererOrigin: string | null = null;
    if (referer) {
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        // Malformed referer ignored
      }
    }

    const requestOrigin = origin || refererOrigin;

    // Block state-changing requests from untrusted external origins
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      if (secFetchSite === "cross-site" || (requestOrigin && requestOrigin !== nextUrlOrigin)) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF block: Request origin is untrusted" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Block unauthorized cross-origin reads
    if (secFetchSite === "cross-site" || (requestOrigin && requestOrigin !== nextUrlOrigin)) {
      return new NextResponse(
        JSON.stringify({ error: "CORS block: Cross-origin requests not allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Check if request has Supabase auth cookies (handles chunked cookies like sb-*-auth-token.0)
  // Narrow match: only sb-*-auth-token* to avoid false positives on unrelated *token* cookies.
  const hasAuthCookies = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
  );

  const isDashboardRoute = path.startsWith("/dashboard");
  const isApiRoute = path.startsWith("/api");

  // ─── 2. PUBLIC NON-API ROUTES: Zero Supabase contact needed ───
  // Public pages (homepage, login, signup, jobs, explore, community) pass through instantly
  // API routes without any auth cookies also pass through instantly with zero network delay
  if (!isDashboardRoute && (!isApiRoute || !hasAuthCookies)) {
    return NextResponse.next({ request });
  }

  // ─── 3. AUTH / SESSION REFRESH HANDLING ───
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "service_unavailable");
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  // For /dashboard/* without any auth cookies, immediately redirect to login
  if (isDashboardRoute && !hasAuthCookies) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  let authedUserId: string | null = null;
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  };
  const recordedCookies: CookieToSet[] = [];

  // Rebuilds the passthrough response from the live request plus all recorded
  // Set-Cookie operations, stamping the validated user id so pages/API routes
  // can skip their own duplicate getUser() call (a full Auth-server round-trip
  // per request — the single biggest per-navigation tax in the logs).
  const finalizeResponse = () => {
    const headers = new Headers(request.headers);
    if (authedUserId) headers.set("x-user-id", authedUserId);
    supabaseResponse = NextResponse.next({ request: { headers } });
    for (const c of recordedCookies) {
      if (c.options) supabaseResponse.cookies.set(c.name, c.value, c.options);
      else supabaseResponse.cookies.set(c.name, c.value);
    }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // Record (dedup by name); applied in finalizeResponse so the
            // stamped identity header is never lost by a rebuild.
            for (const c of cookiesToSet) {
              const i = recordedCookies.findIndex((k) => k.name === c.name);
              if (i >= 0) recordedCookies[i] = c;
              else recordedCookies.push(c);
            }
          },
        },
        global: {
          fetch: (url, options) => {
            const { signal: callerSignal, ...rest } = (options ?? {}) as RequestInit & { signal?: AbortSignal };
            const signals = [controller.signal, callerSignal].filter(Boolean) as AbortSignal[];
            const combined = signals.length <= 1 ? signals[0] : AbortSignal.any(signals);
            return fetch(url, { ...rest, signal: combined ?? controller.signal });
          },
        },
      }
    );

    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } finally {
      clearTimeout(timeout);
    }
    authedUserId = user?.id ?? null;
    finalizeResponse();

    // If request is to an API route:
    // We refreshed the session cookies in supabaseResponse; pass through to the API handler.
    // Never redirect API traffic to an HTML page.
    if (isApiRoute) {
      return supabaseResponse;
    }

    // If request is to a /dashboard/* route:
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Role gate: ONLY /dashboard/admin keeps a middleware-level check, because
    // admin pages use the service-role client (RLS bypass) and have no per-page
    // guards of their own. Admin visits are rare, so one extra query here is fine.
    // Caster/company role UX is enforced in their pages via requireRole() (lib/viewer.ts),
    // which shares one cached profile query per request instead of adding a
    // round-trip to every navigation. Their data is RLS/API-guarded regardless.
    if (path.startsWith("/dashboard/admin")) {
      // Fail-closed: if profile lookup fails, redirect to login.
      const { data: profile, error: profileError } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      if (profileError || !profile?.role) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "profile_missing");
        return NextResponse.redirect(url);
      }
      const role = profile.role as string;
      if (role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = role === "caster" || role === "company" ? `/dashboard/${role}` : "/login";
        return NextResponse.redirect(url);
      }
    }
  } catch {
    // Supabase unreachable (timeout, network down, project paused)
    if (isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "service_unavailable");
      return NextResponse.redirect(url);
    }
    finalizeResponse();
    return supabaseResponse;
  }

  finalizeResponse();
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
