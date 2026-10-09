# Supabase migration notes

The dated SQL files in this directory document the profile-photo privacy changes applied to the existing Plunge Supabase project.

**Important:** Earlier Plunge schema, RLS, and RPC changes were applied through project tooling before a complete migration directory was established. This directory is therefore not yet a complete bootstrap history for a brand-new database. Do not reset a database or assume `supabase db push` can reconstruct the full project until the earlier migrations have been recovered and reconciled with the remote migration history.

Current database migration history is the authority for what has actually been applied. Keep future schema changes in versioned SQL files and verify each migration against that history.
