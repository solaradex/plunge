drop policy if exists "message attachments insert members" on public.message_attachments;
drop policy if exists "message attachments select members" on public.message_attachments;

alter policy admin_users_self_read
on public.admin_users
using (user_id = (select auth.uid()));

drop policy if exists profile_photos_select_admin on public.profile_photos;
drop policy if exists profile_photos_select_active on public.profile_photos;

create policy profile_photos_select_active
on public.profile_photos
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles p
    where p.id = profile_photos.user_id
      and p.status = 'active'
      and profile_photos.moderation_status = 'approved'
  )
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
  )
);
