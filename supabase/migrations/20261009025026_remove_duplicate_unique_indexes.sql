-- Keep the unique constraints and remove only the redundant standalone indexes.
drop index if exists public.likes_from_to_unique;
drop index if exists public.matches_pair_unique;
