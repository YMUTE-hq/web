import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

// Same build-phase escape hatch as lib/supabase-server.ts: prerender renders
// client components (e.g. ChatWidget calls this at render time) with no env.
// Fail open with a dummy endpoint during `next build` only.
const isBuildPhase =
  typeof process !== "undefined" && process.env.NEXT_PHASE === "phase-production-build";

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (isBuildPhase) {
      console.warn("[Supabase] Missing env during build — using placeholder client for prerender");
      if (!browserClient) {
        browserClient = createBrowserClient(
          "https://placeholder.supabase.co",
          "placeholder-anon-key"
        );
      }
      return browserClient;
    }
    throw new Error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
};
