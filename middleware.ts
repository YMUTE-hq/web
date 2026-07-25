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

  let supabaseResponse = NextResponse.next({ request });

  // Initialize securely with correct types
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (path.startsWith("/dashboard")) {
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
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
