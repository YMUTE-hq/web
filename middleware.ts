import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

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
  const hasAuthCookies = request.cookies.getAll().some(
    (c) => c.name.includes("auth-token") || c.name.includes("token") || c.name.startsWith("sb-")
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
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
        global: {
          fetch: (url, options) => {
            return fetch(url, { ...options, signal: controller.signal });
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    clearTimeout(timeout);

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

    // Role-Based Access Control (RBAC) fetching
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    const role = profile?.role || "user";

    // Admin protecting
    if (path.startsWith("/dashboard/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "user" ? "/" : `/dashboard/${role}`;
      return NextResponse.redirect(url);
    }

    // Caster protecting
    if (path.startsWith("/dashboard/caster") && role !== "caster") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/dashboard/admin" : (role === "user" ? "/" : `/dashboard/${role}`);
      return NextResponse.redirect(url);
    }

    // Company protecting
    if (path.startsWith("/dashboard/company") && role !== "company") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/dashboard/admin" : (role === "user" ? "/" : `/dashboard/${role}`);
      return NextResponse.redirect(url);
    }
  } catch {
    // Supabase unreachable (timeout, network down, project paused)
    if (isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "service_unavailable");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
