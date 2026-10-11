# Plunge

Plunge is a local-first social and dating platform for adults 18+ to discover people nearby, connect around interests, and chat. Exact coordinates are private; public profiles should show only a city/state and approximate distance.

## Stack

- Next.js and TypeScript
- Supabase Auth, PostgreSQL, Storage, and Realtime
- GitHub Actions for lint/build checks

## Local development

1. Install Node.js 22 or newer and npm.
2. Copy the environment template below into a local `.env.local` file and fill in the public Supabase project values.
3. Install dependencies with `npm install`.
4. Run `npm run dev` and open `http://localhost:3000`.
5. Before pushing changes, run `npm run lint` and `npm run build`.

Required browser/server environment variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://pukwdnexknvspljqyvlk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The publishable key is intended for browser use and does not replace database security. Row-level security and RPC authorization remain essential. **Never place a Supabase service-role key in a `NEXT_PUBLIC_*` variable, commit it to Git, or expose it to the browser.**

## Supabase Auth configuration

In Supabase Dashboard → Authentication → URL Configuration:

- Set Site URL to the deployed Plunge origin.
- Add the deployed origin plus `/onboarding` and `/reset-password` to Redirect URLs.
- For local development, allow `http://localhost:3000/onboarding` and `http://localhost:3000/reset-password`.
- Use exact origins and routes rather than a broad production wildcard.

## Database migration caution

The SQL files in `supabase/migrations/` document selected changes made after the original schema was created. They are **not yet a complete bootstrap history** for a fresh database. Do not reset the live project or assume these migrations alone can reconstruct it. See `supabase/README.md`.

## Pre-launch blockers

- Deploy to Vercel and configure the two public Supabase environment variables in each required environment.
- Verify email confirmation and password recovery end-to-end using the deployed origin.
- Test signup, adult-age enforcement, onboarding, discovery, likes/matches, chat, image attachments, blocking, reporting, and moderation with separate test accounts.
- Review draft Terms, Privacy Policy, and community guidelines, including contact, retention, deletion, and moderation disclosures.
- Review and pin dependency versions, create a committed lockfile from a real install, and resolve dependency audit findings without forced breaking upgrades.
- Add automated authorization tests for admin-only RPCs, inactive accounts, blocked pairs, and conversation non-members.

CI runs `npm install`, `npm run lint`, and `npm run build` on Node.js 22. A successful build does not replace the end-to-end checks above.
