# Spade Scientific Lifting (SSL)

A science-based strength/lifting coaching platform: clients track training and
nutrition, and the coach manages clients and consultations. See `BRAND.md`
for the color palette and contrast rules.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres +
Auth + RLS) · Recharts · React Hook Form + Zod · Vitest

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then
   copy the env template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   You need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API).

3. **Apply the database schema** — see `supabase/README.md` for the full
   walkthrough (dashboard SQL editor or Supabase CLI). In short, run the three
   files in `supabase/migrations/` **in order**:

   ```
   0001_schema.sql  -> 0002_rls.sql  -> 0003_functions.sql
   ```

4. **Seed demo data** (one coach + 3 clients with sample history):

   ```bash
   npm run seed
   ```

   Prints the demo login credentials when done (all accounts share one
   password). Requires the service-role key from step 2.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in as the seeded
   coach to see the coach app, or as a seeded client for the client app.

## Tests

The nutrition engine (`src/lib/nutrition/engine.ts`) and lifting engine
(`src/lib/lifting/engine.ts`) are pure, dependency-free modules with unit
tests:

```bash
npm test
```

## Project structure

```
src/
  app/
    (public pages: /, /methodology, /pricing, /sign-up, /sign-in)
    onboarding/            baseline body-stats + goal capture
    (client)/              client app: dashboard, lifting, nutrition,
                            supplements, leaderboard, consultations, settings
    coach/                 coach app: roster, client detail, meetings,
                            availability, settings
  components/
    ui/                    Button, Card, Badge, ProgressBar, Input, FormField
    layout/                PublicNav/Footer, ClientNav, CoachNav
    charts/                Recharts wrappers (progress, adherence, DOTS)
  lib/
    nutrition/              TDEE/macro engine + DB wiring (standalone + tested)
    lifting/                Epley 1RM + DOTS score engine (standalone + tested)
    supabase/               browser/server/admin Supabase clients
    validation/             Zod schemas
  types/database.ts          hand-written Supabase types (regenerate with
                              `supabase gen types` once a real project exists)
supabase/
  migrations/                 SQL schema, RLS policies, functions
  seed/seed.ts                 demo data seed script
```

## Known gaps / stretch goals not built in v1

- Google OAuth sign-in (email/password only for now).
- Food database API integration (USDA FoodData Central / Open Food Facts) —
  `food_logs.external_food_id` is reserved for this; logging is manual entry
  for now.
- Email notifications for scheduled meetings (in-app notifications only).
- Bitcoin payment automation — the pricing page describes the flow, but no
  wallet address or payment verification is wired up yet.
