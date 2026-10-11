# Plunge RPC security review

Review date: 2026-10-11

This is a focused review of the 14 public `SECURITY DEFINER` RPCs reported by the Supabase security advisor. It is not a penetration test or a production-readiness certification.

## Verified live controls

- The reviewed functions have a fixed `search_path=public`.
- `supabase/tests/definer_rpc_privileges.sql` was run against the live project and passed: exposed public `SECURITY DEFINER` functions had fixed search paths, were not executable by `anon`, and did not grant `EXECUTE` to `PUBLIC`. This checks grants and configuration, not the correctness of each function's internal authorization.
- `supabase/tests/rls_baseline.sql` was run against the live project and passed: all 16 expected user, discovery, messaging, moderation, and admin tables exist with RLS enabled and at least one policy. This does not verify each policy predicate.
- Live privilege checks confirmed that `anon` and `PUBLIC` cannot execute these functions; `authenticated` can execute them because the app calls them for signed-in features.
- Admin mutation RPCs perform an explicit `public.is_admin()` check before changing moderation state.
- User-facing RPCs validate the authenticated caller and/or conversation membership as appropriate.
- Profile discovery requires an active caller, filters inactive profiles, and excludes blocks in either direction.
- Direct authenticated reads of `public.profiles` now also exclude active profiles when either side has blocked the other; users can still read their own profile row.
- Authenticated users can no longer directly insert rows into `conversations` or `conversation_members`. Conversation and membership creation is restricted to the authorized `create_direct_conversation` RPC, preventing users from self-joining another conversation and reading its history.
- Public-profile retrieval returns an explicit allowlist of public fields and approved photo paths, rejects self-targets, inactive profiles, and blocked pairs.
- Direct conversation creation requires active accounts, no block in either direction, and an active match.
- Message read receipts require conversation membership.
- Conversation reports require the reporter to be a member and the reported person to be another member of that conversation; report reason and details length are validated.
- User reports validate the caller, reject self-reporting, constrain reason values, and cap details at 2,000 characters.

## RPC inventory

| Function | Intended signed-in use | Main authorization boundary |
| --- | --- | --- |
| `admin_set_photo_status` | Approve/reject profile photos | Admin role check and allowlisted statuses |
| `admin_set_report_status` | Update report workflow | Admin role check and allowlisted statuses |
| `admin_set_user_status` | Pause/ban/restore accounts | Admin role check, allowlisted statuses, cannot target self |
| `block_user` | Block another account | Authenticated caller; rejects null/self target |
| `create_direct_conversation` | Start or retrieve a match chat | Active accounts, active match, no block either way |
| `get_discovery_candidates` | Load local discovery feed | Active caller; age, preferences, distance, block and prior-like filters |
| `get_my_blocked_user_ids` | Hide blocked users in match lists | Returns only account IDs in blocks involving the caller; no global block data |
| `get_public_profile` | Load another profile | Authenticated caller; active target; no self-target or blocked pair; field allowlist |
| `is_admin` | Check admin UI capability | Returns only whether the caller has an admin row |
| `is_conversation_member` | Membership predicate for policies/RPCs | Returns only whether the caller is a member |
| `like_profile` | Like a profile and create reciprocal matches | Active caller/target, adult target, no block either way |
| `mark_conversation_read` | Update own read receipt | Conversation membership and caller-scoped update |
| `report_conversation_user` | Report another chat participant | Conversation membership, valid other-member target, reason allowlist, detail cap |
| `report_user` | Report a profile | Authenticated caller, no self-report, reason allowlist, detail cap |

## Remaining work

- Supabase's advisor still reports 14 authenticated-executable `SECURITY DEFINER` functions. The new `get_my_blocked_user_ids` RPC returns only the other account IDs involved in blocks with the signed-in caller; it does not expose the global blocks table. This is expected for RPCs that must perform controlled writes or bypass row-level policies, but each function must remain individually reviewed as code changes.
- Add automated database-level authorization tests for non-admin/admin callers, blocked pairs, inactive accounts, and non-members before launch.
- Reconcile the older schema/RLS/RPC history into a complete bootstrap migration set. The existing migration directory is not a full fresh-database setup; do not reset the live project or treat these files as a complete bootstrap.
- Perform end-to-end testing with separate test accounts and review legal/safety materials before public launch.
- Baseline HTTP response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a restricted `Permissions-Policy`) are configured in `next.config.ts`; verify the deployed responses after hosting is configured.
