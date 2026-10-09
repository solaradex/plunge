create or replace function private.force_photo_moderation_pending()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Users cannot approve their own uploads; admins may use the guarded moderation RPC.
  if (select auth.uid()) is not null and not public.is_admin() then
    new.moderation_status := 'pending';
  end if;
  return new;
end;
$$;

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

  if cid is not null then
    return cid;
  end if;

  insert into public.conversations(conversation_type, created_by)
  values ('direct', me)
  returning id into cid;

  insert into public.conversation_members(conversation_id, user_id)
  values (cid, me), (cid, target_user_id);

  return cid;
end;
$$;

create or replace function public.report_conversation_user(
  cid uuid,
  target_user_id uuid,
  report_reason text,
  report_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  rid uuid;
begin
  if auth.uid() is null or not public.is_conversation_member(cid) then
    raise exception 'Conversation access denied';
  end if;

  if target_user_id is null
     or target_user_id = auth.uid()
     or not exists (
       select 1 from public.conversation_members cm
       where cm.conversation_id = cid and cm.user_id = target_user_id
     ) then
    raise exception 'Invalid report target';
  end if;

  if report_reason not in ('harassment','spam','scam','fake_profile','inappropriate_image','threat','underage_concern','other') then
    raise exception 'Invalid report reason';
  end if;

  insert into public.reports(reporter_id, reported_user_id, reason, details)
  values (auth.uid(), target_user_id, report_reason, nullif(left(coalesce(report_details, ''), 2000), ''))
  returning id into rid;

  return rid;
end;
$$;

drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member
on public.messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = (select auth.uid())
  )
  and not exists (
    select 1
    from public.conversation_members peer
    join public.blocks b
      on (b.blocker_id = (select auth.uid()) and b.blocked_id = peer.user_id)
      or (b.blocker_id = peer.user_id and b.blocked_id = (select auth.uid()))
    where peer.conversation_id = messages.conversation_id
      and peer.user_id <> (select auth.uid())
  )
);
