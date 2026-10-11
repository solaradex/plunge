drop policy if exists profiles_select_active on public.profiles;

create policy profiles_select_active
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (
    status = 'active'
    and not private.is_profile_photo_blocked(id)
  )
);
