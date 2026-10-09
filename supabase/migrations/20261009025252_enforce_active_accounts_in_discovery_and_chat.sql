create or replace function private.is_conversation_unavailable(target_conversation_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select
    not exists (
      select 1 from public.conversation_members mine
      join public.profiles my_profile on my_profile.id = mine.user_id
      where mine.conversation_id = target_conversation_id
        and mine.user_id = (select auth.uid())
        and my_profile.status = 'active'
    )
    or exists (
      select 1 from public.conversation_members peer
      left join public.profiles peer_profile on peer_profile.id = peer.user_id
      where peer.conversation_id = target_conversation_id
        and peer.user_id <> (select auth.uid())
        and (
          peer_profile.status is distinct from 'active'
          or exists (
            select 1 from public.blocks b
            where (b.blocker_id = (select auth.uid()) and b.blocked_id = peer.user_id)
               or (b.blocker_id = peer.user_id and b.blocked_id = (select auth.uid()))
          )
        )
    );
$$;

revoke all on function private.is_conversation_unavailable(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_conversation_unavailable(uuid) to authenticated;

create or replace function public.like_profile(target_user_id uuid)
returns table(matched boolean, match_id uuid)
language plpgsql security definer set search_path = 'public'
as $$
declare me uuid := auth.uid(); new_match uuid; a uuid; b uuid;
begin
  if me is null or target_user_id is null or me = target_user_id then raise exception 'Invalid like target'; end if;
  if not exists (select 1 from public.profiles p where p.id = me and p.status = 'active') then raise exception 'Account unavailable'; end if;
  if not exists (
    select 1 from public.profiles p join public.profile_private pp on pp.user_id = p.id
    where p.id = target_user_id and p.status = 'active'
      and pp.birth_date <= current_date - interval '18 years'
  ) then raise exception 'Profile unavailable'; end if;
  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = me and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = me)
  ) then raise exception 'Profile unavailable'; end if;
  insert into public.likes(from_user_id, to_user_id) values (me, target_user_id) on conflict do nothing;
  if exists (select 1 from public.likes l where l.from_user_id = target_user_id and l.to_user_id = me) then
    a := least(me, target_user_id); b := greatest(me, target_user_id);
    insert into public.matches(user_a_id, user_b_id, status) values (a, b, 'active')
      on conflict do nothing returning id into new_match;
    if new_match is null then
      select m.id into new_match from public.matches m
      where m.user_a_id = a and m.user_b_id = b and m.status = 'active' limit 1;
    end if;
    return query select true, new_match;
  end if;
  return query select false, null::uuid;
end;
$$;

create or replace function public.get_discovery_candidates(limit_count integer default 20)
returns table(id uuid, display_name text, gender text, city text, state text, bio text, age integer, distance_miles integer, interests text[], compatibility_score integer, photo_path text)
language sql security definer set search_path = 'public'
as $$
with me as (
  select p.id, pp.birth_date, pp.latitude, pp.longitude,
    coalesce(pref.interested_genders, array['man','woman']::text[]) interested_genders,
    greatest(18, coalesce(pref.min_age,18)) min_age,
    least(100, coalesce(pref.max_age,100)) max_age,
    least(500, greatest(1, coalesce(pref.max_distance_miles,50))) max_distance
  from public.profiles p
  join public.profile_private pp on pp.user_id = p.id
  left join public.preferences pref on pref.user_id = p.id
  where p.id = auth.uid() and p.status = 'active'
),
candidates as (
  select p.id,p.display_name,p.gender,p.city,p.state,p.bio,
    extract(year from age(current_date,pp.birth_date))::int age,
    case when me.latitude is not null and pp.latitude is not null then
      round((3958.7613*2*asin(sqrt(power(sin(radians(pp.latitude-me.latitude)/2),2)+cos(radians(me.latitude))*cos(radians(pp.latitude))*power(sin(radians(pp.longitude-me.longitude)/2),2))))::numeric)::int
      else null end distance_miles,
    array(select i.name from public.profile_interests pi join public.interests i on i.id=pi.interest_id where pi.user_id=p.id order by i.name) interests,
    (select ph.storage_path from public.profile_photos ph where ph.user_id=p.id and ph.is_primary and ph.moderation_status='approved' order by ph.sort_order limit 1) photo_path,
    me.interested_genders,me.min_age,me.max_age,me.max_distance,
    exists(select 1 from public.likes l where l.from_user_id=p.id and l.to_user_id=me.id) they_liked_me
  from public.profiles p
  join public.profile_private pp on pp.user_id=p.id
  cross join me
  where p.id<>me.id and p.status='active'
    and pp.birth_date <= current_date - interval '18 years'
    and extract(year from age(current_date,pp.birth_date))::int between me.min_age and me.max_age
    and p.gender=any(me.interested_genders)
    and not exists(select 1 from public.blocks b where b.blocker_id=me.id and b.blocked_id=p.id)
    and not exists(select 1 from public.blocks b where b.blocker_id=p.id and b.blocked_id=me.id)
    and not exists(select 1 from public.likes l where l.from_user_id=me.id and l.to_user_id=p.id)
    and (me.latitude is null or me.longitude is null or pp.latitude is null or pp.longitude is null or
      (3958.7613*2*asin(sqrt(power(sin(radians(pp.latitude-me.latitude)/2),2)+cos(radians(me.latitude))*cos(radians(pp.latitude))*power(sin(radians(pp.longitude-me.longitude)/2),2))))<=me.max_distance)
),
scored as (
  select c.*,least(100,45
    + case when c.distance_miles is not null then greatest(0,25-c.distance_miles)::int else 8 end
    + least(20,coalesce((
      select count(*) from unnest(c.interests) x
      join unnest((select array_agg(i.name) from public.profile_interests pi join public.interests i on i.id=pi.interest_id where pi.user_id=(select id from me))) y on x=y
    ),0)::int*5)
    + case when c.they_liked_me then 10 else 0 end
  )::int compatibility_score
  from candidates c
)
select id,display_name,gender,city,state,bio,age,distance_miles,interests,compatibility_score,photo_path
from scored order by compatibility_score desc,distance_miles nulls last,id
limit greatest(1,least(limit_count,100));
$$;

drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = (select auth.uid()))
  and not private.is_conversation_unavailable(messages.conversation_id)
);

drop policy if exists message_attachments_insert_member on public.message_attachments;
create policy message_attachments_insert_member on public.message_attachments for insert to authenticated
with check (
  exists (
    select 1 from public.messages m join public.conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = message_attachments.message_id and m.sender_id = (select auth.uid())
      and cm.user_id = (select auth.uid()) and not private.is_conversation_unavailable(m.conversation_id)
  )
);

drop policy if exists plunge_message_upload_member on storage.objects;
create policy plunge_message_upload_member on storage.objects for insert to authenticated
with check (
  bucket_id = 'plunge-messages'
  and exists (select 1 from public.conversation_members cm where cm.conversation_id = ((storage.foldername(objects.name))[1])::uuid and cm.user_id = (select auth.uid()))
  and not private.is_conversation_unavailable(((storage.foldername(objects.name))[1])::uuid)
);

drop function if exists private.is_conversation_blocked(uuid);
