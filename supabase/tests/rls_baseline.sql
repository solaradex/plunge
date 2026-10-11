-- Read-only baseline check for row-level security on user and messaging tables.
-- Run manually in the Supabase SQL Editor against the intended project.
-- This verifies RLS is enabled and policies exist; it does not prove each
-- policy's predicate is correct, which still requires multi-user tests.

DO $$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'profiles',
    'profile_private',
    'preferences',
    'interests',
    'profile_interests',
    'profile_photos',
    'likes',
    'matches',
    'blocks',
    'conversations',
    'conversation_members',
    'messages',
    'message_attachments',
    'reports',
    'notifications',
    'admin_users'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class AS c
      JOIN pg_namespace AS n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = required_table
        AND c.relkind IN ('r', 'p')
        AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS regression: public.% is missing or RLS is disabled',
        required_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies AS policy
      WHERE policy.schemaname = 'public'
        AND policy.tablename = required_table
    ) THEN
      RAISE EXCEPTION 'RLS regression: public.% has no policies', required_table;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies AS policy
    WHERE policy.schemaname = 'public'
      AND policy.tablename = 'profiles'
      AND policy.policyname = 'profiles_select_active'
      AND policy.qual LIKE '%is_profile_photo_blocked%'
  ) THEN
    RAISE EXCEPTION
      'Privacy regression: direct profile SELECT policy does not exclude blocked pairs';
  END IF;
END
$$;

SELECT
  'PASS: all 16 expected tables have RLS and policies, and direct profile SELECT excludes blocked pairs.'
  AS result;
