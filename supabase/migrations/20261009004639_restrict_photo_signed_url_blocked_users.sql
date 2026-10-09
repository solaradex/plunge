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
      and not exists (
        select 1
        from public.blocks b
        where (b.blocker_id = (select auth.uid()) and b.blocked_id = pp.user_id)
           or (b.blocker_id = pp.user_id and b.blocked_id = (select auth.uid()))
      )
  )
);
