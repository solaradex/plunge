-- Read-only authorization regression check for public SECURITY DEFINER RPCs.
-- Run manually in the Supabase SQL Editor against the intended project.
-- This checks grants and fixed search_path only; it does not replace multi-user
-- end-to-end tests of each RPC's business authorization rules.

DO $$
DECLARE
  bad_function text;
BEGIN
  SELECT format('%I.%I(%s)', n.nspname, p.proname,
                pg_get_function_identity_arguments(p.oid))
    INTO bad_function
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
    AND (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      OR NOT EXISTS (
        SELECT 1
        FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) AS setting
        WHERE setting LIKE 'search_path=%'
      )
      OR EXISTS (
        SELECT 1
        FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) AS grant_entry
        WHERE grant_entry.grantee = 0
          AND grant_entry.privilege_type = 'EXECUTE'
      )
    )
  LIMIT 1;

  IF bad_function IS NOT NULL THEN
    RAISE EXCEPTION
      'SECURITY DEFINER privilege regression: % has an unsafe grant or no fixed search_path',
      bad_function;
  END IF;
END
$$;

SELECT
  'PASS: exposed public SECURITY DEFINER RPCs have a fixed search_path, are not executable by anon, and do not grant EXECUTE to PUBLIC.'
  AS result;
