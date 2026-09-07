# Applying the database schema

Migrations live in `supabase/migrations/` and must be applied **in order** —
each file depends on objects created by the one before it:

1. `0001_schema.sql` — tables, enums, the Epley 1RM trigger.
2. `0002_rls.sql` — Row Level Security policies and their helper functions.
3. `0003_functions.sql` — the new-user trigger, leaderboard, and coach roster.

## Option A — Supabase Dashboard (fastest, no CLI install)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste the contents of `0001_schema.sql`, run it.
3. Repeat for `0002_rls.sql`, then `0003_functions.sql`.
4. Copy **Project Settings > API > Project URL** and **anon public key** into
   your `.env.local` (copy `.env.example` first).
5. Copy the **service_role** key too — only used server-side by
   `supabase/seed/seed.ts`, never exposed to the browser.

## Option B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

`supabase db push` applies every file under `supabase/migrations/` in
filename order, so the numeric prefixes matter — don't rename them out of
sequence.

## Seeding demo data

After the schema is applied and `.env.local` is filled in:

```bash
npm run seed
```

This creates one demo coach and 2–3 demo clients with sample lift/nutrition
history (see `supabase/seed/seed.ts`). It uses the service-role key, so it
must be run from your machine — never ship it as a client-facing route.
