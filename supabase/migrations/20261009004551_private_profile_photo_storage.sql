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
  )
);

create policy "plunge_profile_read_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'plunge-profiles'
  and exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
  )
);

update storage.buckets
set public = false
where id = 'plunge-profiles';
