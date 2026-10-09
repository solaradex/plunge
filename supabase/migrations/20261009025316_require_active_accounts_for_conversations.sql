create or replace function public.create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  me uuid := auth.uid();
  cid uuid;
begin
  if me is null or target_user_id is null or me = target_user_id then
    raise exception 'Invalid conversation target';
  end if;

  if not exists (select 1 from public.profiles p where p.id = me and p.status = 'active') then
    raise exception 'Account unavailable';
  end if;

  if not exists (select 1 from public.profiles p where p.id = target_user_id and p.status = 'active') then
    raise exception 'Profile unavailable';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = me and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = me)
  ) then
    raise exception 'Profile unavailable';
  end if;

  if not exists (
    select 1 from public.matches m
    where m.status = 'active'
      and m.user_a_id = least(me, target_user_id)
      and m.user_b_id = greatest(me, target_user_id)
  ) then
    raise exception 'You must match before chatting';
  end if;

  select c.id into cid
  from public.conversations c
  join public.conversation_members cm1 on cm1.conversation_id = c.id and cm1.user_id = me
  join public.conversation_members cm2 on cm2.conversation_id = c.id and cm2.user_id = target_user_id
  where c.conversation_type = 'direct'
  limit 1;

  if cid is not null then return cid; end if;

  insert into public.conversations(conversation_type, created_by)
  values ('direct', me)
  returning id into cid;

  insert into public.conversation_members(conversation_id, user_id)
  values (cid, me), (cid, target_user_id);

  return cid;
end;
$$;
