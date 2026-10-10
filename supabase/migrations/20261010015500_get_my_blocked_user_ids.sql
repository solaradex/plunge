-- Return only the other user IDs involved in blocks with the authenticated caller.
-- This lets the matches UI hide people who blocked the caller without exposing
-- the global blocks table through its row-level security policy.
create or replace function public.get_my_blocked_user_ids()
returns table(blocked_user_id uuid)
language sql
stable
security definer
set search_path = public
as $function$
  select case
    when b.blocker_id = auth.uid() then b.blocked_id
    else b.blocker_id
  end
  from public.blocks b
  where auth.uid() is not null
    and (b.blocker_id = auth.uid() or b.blocked_id = auth.uid());
$function$;

revoke all on function public.get_my_blocked_user_ids() from public, anon;
grant execute on function public.get_my_blocked_user_ids() to authenticated;
