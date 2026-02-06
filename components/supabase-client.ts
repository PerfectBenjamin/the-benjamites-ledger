import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

async function tryRefreshSession() {
  try {
    // Attempt to refresh server-side session using refresh token cookie
    await fetch("/api/refresh", { method: "POST", credentials: "same-origin" });
  } catch (err) {
    // swallow errors — refresh is best-effort here
    console.warn("Session refresh failed:", err);
  }
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    // Trigger a background refresh attempt before client use. This helps
    // recover when the access token cookie has expired while the refresh
    // token is still valid.
    void tryRefreshSession();

    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return supabaseClient;
}
