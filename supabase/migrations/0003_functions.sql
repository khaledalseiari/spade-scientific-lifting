-- Trigger: create a `profiles` row whenever a new auth.users row appears.
--
-- SECURITY: this always inserts role = 'client', ignoring anything a caller
-- might put in signup metadata. Coach accounts are never created through
-- public sign-up — they're seeded directly (see supabase/seed/seed.sql) or
-- promoted manually by an existing coach/admin via the database. Do not
-- change this to read a client-supplied "role" field; that would let anyone
-- self-promote to coach.
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    'client',
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Consistency streak: consecutive days (ending today) with at least one
-- food log entry. Used by the "friendlier" leaderboard mode and by the
-- coach roster's adherence glance.
create function get_consistency_streak(target_user_id uuid) returns int as $$
declare
  streak int := 0;
  d date := current_date;
begin
  loop
    exit when not exists (
      select 1 from food_logs where user_id = target_user_id and date = d
    );
    streak := streak + 1;
    d := d - 1;
  end loop;
  return streak;
end;
$$ language plpgsql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Leaderboard: only opted-in clients, only safe fields (first name/username,
-- bodyweight + best-lift totals for the app layer to turn into a Wilks/DOTS
-- score, and a consistency streak). SECURITY DEFINER is required here because
-- the leaderboard crosses client boundaries that normal RLS would block —
-- the query below is the only place that's allowed to happen, and it never
-- returns email, user id, or any other identifying field.
create function get_leaderboard() returns table (
  display_name text,
  bodyweight_kg numeric,
  total_kg numeric,
  streak_days int,
  sex sex_type
) as $$
  with opted_in as (
    select cp.user_id, cp.sex
    from client_profiles cp
    join coach_settings cs on cs.coach_id = cp.coach_id
    where cp.leaderboard_opt_in = true and cs.leaderboard_enabled = true
  ),
  latest_bw as (
    select distinct on (user_id) user_id, weight_kg
    from body_stats
    where user_id in (select user_id from opted_in)
    order by user_id, date desc
  ),
  best_lifts as (
    select user_id, lift_name, max(weight) as best_weight
    from lifts
    where user_id in (select user_id from opted_in)
      and lift_name in ('Squat', 'Bench Press', 'Deadlift')
    group by user_id, lift_name
  ),
  totals as (
    select user_id, sum(best_weight) as total_kg
    from best_lifts
    group by user_id
  )
  select
    coalesce(p.username, split_part(p.name, ' ', 1)) as display_name,
    lb.weight_kg as bodyweight_kg,
    t.total_kg,
    get_consistency_streak(oi.user_id) as streak_days,
    oi.sex
  from opted_in oi
  join profiles p on p.id = oi.user_id
  left join latest_bw lb on lb.user_id = oi.user_id
  left join totals t on t.user_id = oi.user_id;
$$ language sql stable security definer set search_path = public;

grant execute on function get_leaderboard() to authenticated;

-- ---------------------------------------------------------------------------
-- Coach roster: adherence (% of last 7 days with a food log) + last check-in
-- per client. Scoped to auth.uid() inside the function body — not just via
-- caller RLS — so it can't be pointed at another coach's clients even though
-- it runs as SECURITY DEFINER.
create function get_coach_roster() returns table (
  client_id uuid,
  name text,
  adherence_pct numeric,
  last_check_in date,
  leaderboard_opt_in boolean
) as $$
  select
    cp.user_id as client_id,
    p.name,
    round(
      (
        select count(distinct date)
        from food_logs f
        where f.user_id = cp.user_id and f.date > current_date - 7
      )::numeric / 7 * 100,
      0
    ) as adherence_pct,
    (
      select max(date) from body_stats b where b.user_id = cp.user_id
    ) as last_check_in,
    cp.leaderboard_opt_in
  from client_profiles cp
  join profiles p on p.id = cp.user_id
  where cp.coach_id = auth.uid();
$$ language sql stable security definer set search_path = public;

grant execute on function get_coach_roster() to authenticated;
