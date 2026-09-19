import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder-anon-key",
      {
        auth: {
          // Custom lock bypass to prevent "AbortError: Lock broken by another request with the 'steal' option"
          // in multi-tab, HMR, or OAuth redirect scenarios
          lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
            return await fn();
          },
        },
      }
    );
  }

  return browserClient;
};
