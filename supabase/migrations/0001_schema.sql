-- Spade Scientific Lifting — core schema
-- Apply in order: 0001_schema.sql -> 0002_rls.sql -> 0003_functions.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('client', 'coach');
create type sex_type as enum ('male', 'female');
create type activity_level as enum (
  'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
);
create type goal_type as enum ('fat_loss', 'maintenance', 'muscle_gain');
create type training_experience as enum ('beginner', 'intermediate', 'advanced');
create type target_source as enum ('auto', 'coach_override');
create type added_by_type as enum ('client', 'coach');
create type meeting_type as enum ('check_in', 'form_review', 'nutrition_consult', 'general_question');
create type meeting_status as enum ('pending', 'accepted', 'declined', 'rescheduled_proposed');
create type notification_type as enum (
  'meeting_requested', 'meeting_scheduled', 'meeting_declined', 'meeting_reschedule_proposed',
  'target_flagged', 'target_updated'
);

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users row, holds role + display name
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  name text not null,
  username text unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- client_profiles — onboarding data that seeds the nutrition engine
-- ---------------------------------------------------------------------------
create table client_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  coach_id uuid references profiles(id) on delete set null,
  sex sex_type not null,
  dob date not null,
  height_cm numeric(5, 1) not null check (height_cm > 0),
  activity_level activity_level not null,
  goal goal_type not null,
  training_experience training_experience not null default 'beginner',
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- coach_settings — site-wide feature toggles a coach controls
-- ---------------------------------------------------------------------------
create table coach_settings (
  coach_id uuid primary key references profiles(id) on delete cascade,
  leaderboard_enabled boolean not null default true
);

-- ---------------------------------------------------------------------------
-- body_stats — rolling weight/body-fat log, drives TDEE trend logic
-- ---------------------------------------------------------------------------
create table body_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  weight_kg numeric(5, 2) not null check (weight_kg > 0),
  body_fat_pct numeric(4, 1) check (body_fat_pct is null or (body_fat_pct >= 0 and body_fat_pct <= 100)),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ---------------------------------------------------------------------------
-- lifts — logged sets; est_1rm computed server-side via trigger (Epley)
-- ---------------------------------------------------------------------------
create table lifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lift_name text not null,
  date date not null,
  weight numeric(6, 2) not null check (weight > 0),
  reps int not null check (reps > 0),
  sets int not null default 1 check (sets > 0),
  rpe numeric(3, 1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
  est_1rm numeric(6, 2),
  created_at timestamptz not null default now()
);

create index lifts_user_lift_date_idx on lifts (user_id, lift_name, date);

-- Epley formula: 1RM = weight * (1 + reps / 30). Reps of 1 return the weight itself.
create function compute_est_1rm() returns trigger as $$
begin
  new.est_1rm := round(new.weight * (1 + new.reps / 30.0), 2);
  return new;
end;
$$ language plpgsql;

create trigger lifts_set_est_1rm
  before insert or update of weight, reps on lifts
  for each row execute function compute_est_1rm();

-- ---------------------------------------------------------------------------
-- nutrition_targets — one row per recalculation event, latest per user wins
-- ---------------------------------------------------------------------------
create table nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  bmr numeric(6, 1) not null,
  tdee numeric(6, 1) not null,
  calorie_target numeric(6, 1) not null,
  protein_g numeric(5, 1) not null,
  carb_g numeric(5, 1) not null,
  fat_g numeric(5, 1) not null,
  source target_source not null default 'auto',
  note text,
  created_at timestamptz not null default now()
);

create index nutrition_targets_user_date_idx on nutrition_targets (user_id, date desc);

-- ---------------------------------------------------------------------------
-- food_logs — manual entry for now; leave room for a food-DB API integration
-- ---------------------------------------------------------------------------
create table food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  meal text not null default 'meal',
  food_item text not null,
  calories numeric(6, 1) not null check (calories >= 0),
  protein_g numeric(5, 1) not null default 0,
  carb_g numeric(5, 1) not null default 0,
  fat_g numeric(5, 1) not null default 0,
  -- Integration point: when a food database API (USDA FoodData Central / Open Food
  -- Facts) is wired in, store its item id here so search/autofill can round-trip.
  external_food_id text,
  created_at timestamptz not null default now()
);

create index food_logs_user_date_idx on food_logs (user_id, date);

-- ---------------------------------------------------------------------------
-- supplements + daily checklist logs
-- ---------------------------------------------------------------------------
create table supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  time_of_day text,
  notes text,
  added_by added_by_type not null default 'client',
  created_at timestamptz not null default now()
);

create table supplement_logs (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references supplements(id) on delete cascade,
  date date not null default current_date,
  taken boolean not null default false,
  unique (supplement_id, date)
);

-- ---------------------------------------------------------------------------
-- meeting requests + simple coach availability
-- ---------------------------------------------------------------------------
create table meeting_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  coach_id uuid not null references profiles(id) on delete cascade,
  type meeting_type not null,
  requested_slots jsonb not null, -- array of ISO timestamps, 2-3 entries
  status meeting_status not null default 'pending',
  notes text,
  coach_note text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meeting_requests_coach_status_idx on meeting_requests (coach_id, status);
create index meeting_requests_client_idx on meeting_requests (client_id);

create table coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

-- ---------------------------------------------------------------------------
-- coach's freeform notes on a client (visible only to the coach, never the client)
create table coach_notes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index coach_notes_coach_client_idx on coach_notes (coach_id, client_id);

-- ---------------------------------------------------------------------------
-- in-app notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on notifications (user_id, read);
