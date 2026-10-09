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
    (select ph.storage_path from public.profile_photos ph
      where ph.user_id=p.id and ph.moderation_status='approved'
      order by ph.is_primary desc, ph.sort_order limit 1) photo_path,
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
      (3958.7613*2*asin(sqrt(power(sin(radians(pp.latitude-me.latitude)/2),2)+cos(radians(pp.longitude-me.longitude)/2)*0+cos(radians(me.latitude))*cos(radians(pp.latitude))*power(sin(radians(pp.longitude-me.longitude)/2),2))))<=me.max_distance)
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
