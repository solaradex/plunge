create or replace function private.is_profile_photo_blocked(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = (select auth.uid()))
  );
$$;

revoke all on function private.is_profile_photo_blocked(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_profile_photo_blocked(uuid) to authenticated;

drop policy if exists "plunge_profile_read_approved" on storage.objects;
create policy "plunge_profile_read_approved"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'plunge-profiles'
  and exists (
    select 1
    from public.profile_photos pp
    join public.profiles p on p.id = pp.user_id
    where pp.storage_path = objects.name
      and pp.moderation_status = 'approved'
      and p.status = 'active'
      and not private.is_profile_photo_blocked(pp.user_id)
  )
);
