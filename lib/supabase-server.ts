import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// During `next build`, prerender touches these clients with no env and no
// request scope. Fail open with a dummy endpoint there (network calls fail
// gracefully into nulls/redirects); fail fast everywhere else.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const BUILD_PLACEHOLDER_URL = "https://placeholder.supabase.co";
const BUILD_PLACEHOLDER_KEY = "placeholder-anon-key";

export const createClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (isBuildPhase) {
      console.warn("[Supabase Server] Missing env during build — using placeholder client for prerender");
      const cookieStore = await cookies();
      return createServerClient(BUILD_PLACEHOLDER_URL, BUILD_PLACEHOLDER_KEY, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      });
    }
    throw new Error("[Supabase Server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const cookieStore = await cookies();
  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // Ignored as middleware handles session refreshing.
          }
        },
      },
    }
  );
};

// Admin client to bypass RLS for trusted backend operations
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (isBuildPhase) {
      console.warn("[Supabase Admin] Missing env during build — using placeholder client for prerender");
      return createSupabaseClient(BUILD_PLACEHOLDER_URL, BUILD_PLACEHOLDER_KEY);
    }
    throw new Error("[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, key);
};
