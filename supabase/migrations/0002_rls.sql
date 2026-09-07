-- Row Level Security — every client/coach data table is locked down here.
-- Helper functions are SECURITY DEFINER + fixed search_path so policies can
-- check cross-table relationships (e.g. "is this the client's coach?")
-- without recursive-RLS problems or search_path hijacking.

create function is_coach() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'coach'
  );
$$ language sql stable security definer set search_path = public;

create function is_client_of_coach(target_client_id uuid) returns boolean as $$
  select exists (
    select 1 from client_profiles
    where user_id = target_client_id and coach_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

create function my_coach_id() returns uuid as $$
  select coach_id from client_profiles where user_id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- Used by the client -> coach notification direction (e.g. a client submits a
-- meeting request and the coach needs to be notified).
create function coach_id_of_notification_target_matches_caller(target_user_id uuid) returns boolean as $$
  select exists (
    select 1 from client_profiles
    where user_id = auth.uid() and coach_id = target_user_id
  );
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select_own_or_coached" on profiles
  for select using (id = auth.uid() or is_client_of_coach(id));

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

-- A brand-new client has no client_profiles row yet, so is_client_of_coach()
-- can't resolve — but onboarding needs to look up the coach to assign.
-- Coach profiles (name only; no email/password is ever exposed here) are
-- readable by any authenticated user so onboarding can complete.
create policy "profiles_select_coaches" on profiles
  for select using (role = 'coach');

-- SECURITY: "profiles_update_own" above only checks row ownership — it does
-- NOT stop a client from writing `role = 'coach'` onto their own row via a
-- normal UPDATE (RLS policies can't compare OLD vs NEW values for a single
-- column, so this can't be expressed as a policy). This trigger closes that
-- hole: any UPDATE arriving as the `authenticated` Postgres role (i.e. every
-- normal end-user request through the app) has `role` forced back to its
-- previous value, no matter what the request tries to set it to. Role
-- changes (client -> coach) must be done as `postgres`/`service_role`
-- (dashboard SQL editor or the seed script), which this trigger does not
-- touch.
create function prevent_role_self_escalation() returns trigger as $$
begin
  if new.role is distinct from old.role and current_user = 'authenticated' then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger profiles_lock_role
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- ---------------------------------------------------------------------------
alter table client_profiles enable row level security;

create policy "client_profiles_select" on client_profiles
  for select using (user_id = auth.uid() or coach_id = auth.uid());

-- SECURITY: coach_id must always point at an actual coach account. Without
-- this check a client could set coach_id to another CLIENT's id, and every
-- "is this the client's coach?" check elsewhere (is_client_of_coach,
-- my_coach_id) would then treat that other client as their coach — handing
-- them read access to this client's lifts/food logs/nutrition targets.
create policy "client_profiles_insert_own" on client_profiles
  for insert with check (
    user_id = auth.uid()
    and (
      coach_id is null
      or exists (select 1 from profiles where id = coach_id and role = 'coach')
    )
  );

create policy "client_profiles_update_own" on client_profiles
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      coach_id is null
      or exists (select 1 from profiles where id = coach_id and role = 'coach')
    )
  );

-- ---------------------------------------------------------------------------
alter table coach_settings enable row level security;

create policy "coach_settings_owner" on coach_settings
  for all using (coach_id = auth.uid() and is_coach())
  with check (coach_id = auth.uid() and is_coach());

-- Clients need to read their coach's site-wide leaderboard toggle.
create policy "coach_settings_readable_by_clients" on coach_settings
  for select using (coach_id = my_coach_id());

-- ---------------------------------------------------------------------------
alter table body_stats enable row level security;

create policy "body_stats_owner" on body_stats
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "body_stats_coach_read" on body_stats
  for select using (is_client_of_coach(user_id));

-- ---------------------------------------------------------------------------
alter table lifts enable row level security;

create policy "lifts_owner" on lifts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "lifts_coach_read" on lifts
  for select using (is_client_of_coach(user_id));

-- ---------------------------------------------------------------------------
alter table nutrition_targets enable row level security;

create policy "nutrition_targets_owner_read" on nutrition_targets
  for select using (user_id = auth.uid() or is_client_of_coach(user_id));

create policy "nutrition_targets_owner_insert_auto" on nutrition_targets
  for insert with check (user_id = auth.uid() and source = 'auto');

create policy "nutrition_targets_coach_override_insert" on nutrition_targets
  for insert with check (is_client_of_coach(user_id) and source = 'coach_override');

-- Targets are immutable rows (each recalculation is a new row) — no update policy.

-- ---------------------------------------------------------------------------
alter table food_logs enable row level security;

create policy "food_logs_owner" on food_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "food_logs_coach_read" on food_logs
  for select using (is_client_of_coach(user_id));

-- ---------------------------------------------------------------------------
alter table supplements enable row level security;

create policy "supplements_client_read" on supplements
  for select using (user_id = auth.uid() or is_client_of_coach(user_id));

create policy "supplements_client_insert" on supplements
  for insert with check (user_id = auth.uid() and added_by = 'client');

create policy "supplements_coach_insert" on supplements
  for insert with check (is_client_of_coach(user_id) and added_by = 'coach');

create policy "supplements_client_modify" on supplements
  for update using (user_id = auth.uid());

create policy "supplements_coach_modify" on supplements
  for update using (is_client_of_coach(user_id));

create policy "supplements_client_delete" on supplements
  for delete using (user_id = auth.uid());

create policy "supplements_coach_delete" on supplements
  for delete using (is_client_of_coach(user_id));

-- ---------------------------------------------------------------------------
alter table supplement_logs enable row level security;

create policy "supplement_logs_access" on supplement_logs
  for all using (
    exists (
      select 1 from supplements s
      where s.id = supplement_logs.supplement_id
        and (s.user_id = auth.uid() or is_client_of_coach(s.user_id))
    )
  ) with check (
    exists (
      select 1 from supplements s
      where s.id = supplement_logs.supplement_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
alter table meeting_requests enable row level security;

create policy "meeting_requests_client_select" on meeting_requests
  for select using (client_id = auth.uid() or coach_id = auth.uid());

create policy "meeting_requests_client_insert" on meeting_requests
  for insert with check (client_id = auth.uid() and coach_id = my_coach_id());

create policy "meeting_requests_coach_update" on meeting_requests
  for update using (coach_id = auth.uid());

-- ---------------------------------------------------------------------------
alter table coach_availability enable row level security;

create policy "coach_availability_owner" on coach_availability
  for all using (coach_id = auth.uid() and is_coach())
  with check (coach_id = auth.uid() and is_coach());

create policy "coach_availability_client_read" on coach_availability
  for select using (coach_id = my_coach_id());

-- ---------------------------------------------------------------------------
-- coach_notes: coach-only, never visible to the client they're about.
alter table coach_notes enable row level security;

create policy "coach_notes_owner" on coach_notes
  for all using (coach_id = auth.uid() and is_client_of_coach(client_id))
  with check (coach_id = auth.uid() and is_client_of_coach(client_id));

-- ---------------------------------------------------------------------------
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on notifications
  for update using (user_id = auth.uid());

create policy "notifications_insert" on notifications
  for insert with check (
    user_id = auth.uid()
    or is_client_of_coach(user_id)
    or coach_id_of_notification_target_matches_caller(user_id)
  );
