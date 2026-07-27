import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // CORS & CSRF Protection for API Routes
  if (path.startsWith("/api")) {
    const origin = request.headers.get("origin");
    const nextUrlOrigin = request.nextUrl.origin;

    // 1. CSRF Protection: Block state-changing requests from external origins
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      if (origin && origin !== nextUrlOrigin) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF block: Request origin is untrusted" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 2. CORS Protection: Block cross-origin reads
    if (origin && origin !== nextUrlOrigin) {
      return new NextResponse(
        JSON.stringify({ error: "CORS block: Cross-origin requests not allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // ─── PUBLIC ROUTES: No Supabase contact needed ───
  // Only contact Supabase for /dashboard/* routes that need auth.
  // Everything else (homepage, login, signup, jobs, explore, community, API routes)
  // passes through instantly with zero network dependency.
  if (!path.startsWith("/dashboard")) {
    return NextResponse.next({ request });
  }

  // ─── PROTECTED ROUTES: /dashboard/* ───
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // No Supabase config — redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "service_unavailable");
    return NextResponse.redirect(url);
  }

  // Check if there are any Supabase auth cookies at all (handles chunked cookies like sb-xxx-auth-token.0)
  const hasAuthCookies = request.cookies.getAll().some(
    (c) => c.name.includes("auth") || c.name.includes("token") || c.name.startsWith("sb-")
  );

  if (!hasAuthCookies) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    // Use AbortController to timeout the Supabase request after 5 seconds
    // so the middleware doesn't hang for 30+ seconds when Supabase is down.
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
    // Redirect to login with error instead of hanging forever
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "service_unavailable");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
