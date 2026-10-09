create policy "profile_photos_select_admin"
on public.profile_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
  )
);
