# Plunge RPC security review

Review date: 2026-10-09

This is a focused review of the 13 public `SECURITY DEFINER` RPCs reported by the Supabase security advisor. It is not a penetration test or a production-readiness certification.

## Verified live controls

- The reviewed functions have a fixed `search_path=public`.
- Live privilege checks confirmed that `anon` and `PUBLIC` cannot execute these functions; `authenticated` can execute them because the app calls them for signed-in features.
- Admin mutation RPCs perform an explicit `public.is_admin()` check before changing moderation state.
- User-facing RPCs validate the authenticated caller and/or conversation membership as appropriate.
- Profile discovery requires an active caller, filters inactive profiles, and excludes blocks in either direction.
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
| `get_public_profile` | Load another profile | Authenticated caller; active target; no self-target or blocked pair; field allowlist |
| `is_admin` | Check admin UI capability | Returns only whether the caller has an admin row |
| `is_conversation_member` | Membership predicate for policies/RPCs | Returns only whether the caller is a member |
| `like_profile` | Like a profile and create reciprocal matches | Active caller/target, adult target, no block either way |
| `mark_conversation_read` | Update own read receipt | Conversation membership and caller-scoped update |
| `report_conversation_user` | Report another chat participant | Conversation membership, valid other-member target, reason allowlist, detail cap |
| `report_user` | Report a profile | Authenticated caller, no self-report, reason allowlist, detail cap |

## Remaining work

- Supabase's advisor still reports 13 authenticated-executable `SECURITY DEFINER` functions. This is expected for RPCs that must perform controlled writes or bypass row-level policies, but each function must remain individually reviewed as code changes.
- Add automated database-level authorization tests for non-admin/admin callers, blocked pairs, inactive accounts, and non-members before launch.
- Reconcile the older schema/RLS/RPC history into a complete bootstrap migration set. The existing migration directory is not a full fresh-database setup; do not reset the live project or treat these files as a complete bootstrap.
- Perform end-to-end testing with separate test accounts and review legal/safety materials before public launch.
