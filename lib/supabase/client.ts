import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Client components can be prerendered by Next.js during CI/build time.
  // Keep that build phase from requiring production Supabase secrets.
  if (!url || !key) {
    if (typeof window === "undefined") {
      return createBrowserClient(
        url || "https://placeholder.supabase.co",
        key || "placeholder-build-key"
      );
    }
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createBrowserClient(url, key);
}
