/**
 * Seeds one demo coach + 3 demo clients with sample lift/nutrition history
 * so the app is reviewable immediately after the schema is applied.
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY set (see supabase/README.md). Run with:
 *   npm run seed
 */
import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../../src/lib/supabase/admin";
import { computeNutritionTargets } from "../../src/lib/nutrition/engine";
import { calculateEpley1RM } from "../../src/lib/lifting/engine";
import type { ActivityLevel, GoalType, SexType } from "../../src/types/database";

const DEMO_PASSWORD = "DemoPass123!";

type DemoClient = {
  email: string;
  name: string;
  sex: SexType;
  dob: string;
  heightCm: number;
  startWeightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
  leaderboardOptIn: boolean;
  liftStart: { squat: number; bench: number; deadlift: number; ohp: number };
};

const DEMO_CLIENTS: DemoClient[] = [
  {
    email: "alex.demo@example.com",
    name: "Alex Rivera",
    sex: "male",
    dob: "1994-03-12",
    heightCm: 178,
    startWeightKg: 84,
    activityLevel: "moderately_active",
    goal: "fat_loss",
    leaderboardOptIn: true,
    liftStart: { squat: 120, bench: 90, deadlift: 150, ohp: 55 },
  },
  {
    email: "priya.demo@example.com",
    name: "Priya Nair",
    sex: "female",
    dob: "1997-07-22",
    heightCm: 165,
    startWeightKg: 62,
    activityLevel: "very_active",
    goal: "muscle_gain",
    leaderboardOptIn: true,
    liftStart: { squat: 70, bench: 40, deadlift: 90, ohp: 25 },
  },
  {
    email: "jordan.demo@example.com",
    name: "Jordan Blake",
    sex: "male",
    dob: "1989-11-02",
    heightCm: 182,
    startWeightKg: 95,
    activityLevel: "lightly_active",
    goal: "maintenance",
    leaderboardOptIn: false,
    liftStart: { squat: 140, bench: 105, deadlift: 175, ohp: 65 },
  },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const admin = createAdminClient();

  console.log("Creating demo coach…");
  const { data: coachAuth, error: coachAuthError } = await admin.auth.admin.createUser({
    email: "coach.demo@example.com",
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: "Demo Coach" },
  });
  if (coachAuthError && !coachAuthError.message.includes("already been registered")) {
    throw coachAuthError;
  }
  const coachId =
    coachAuth?.user?.id ??
    (await admin.auth.admin.listUsers()).data.users.find(
      (u) => u.email === "coach.demo@example.com",
    )?.id;
  if (!coachId) throw new Error("Could not resolve coach id");

  // handle_new_user() always inserts role='client' — promoting to coach
  // requires the service-role key, which is exactly what this script uses.
  await admin.from("profiles").update({ role: "coach" }).eq("id", coachId);
  await admin
    .from("coach_settings")
    .upsert({ coach_id: coachId, leaderboard_enabled: true }, { onConflict: "coach_id" });
  console.log(`Coach ready: ${coachId}`);

  for (const demoClient of DEMO_CLIENTS) {
    console.log(`Creating client ${demoClient.name}…`);
    const { data: clientAuth, error: clientAuthError } = await admin.auth.admin.createUser({
      email: demoClient.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: demoClient.name },
    });
    if (clientAuthError && !clientAuthError.message.includes("already been registered")) {
      throw clientAuthError;
    }
    const clientId =
      clientAuth?.user?.id ??
      (await admin.auth.admin.listUsers()).data.users.find((u) => u.email === demoClient.email)
        ?.id;
    if (!clientId) throw new Error(`Could not resolve id for ${demoClient.email}`);

    await admin.from("client_profiles").upsert(
      {
        user_id: clientId,
        coach_id: coachId,
        sex: demoClient.sex,
        dob: demoClient.dob,
        height_cm: demoClient.heightCm,
        activity_level: demoClient.activityLevel,
        goal: demoClient.goal,
        training_experience: "intermediate",
        leaderboard_opt_in: demoClient.leaderboardOptIn,
      },
      { onConflict: "user_id" },
    );

    // 8 weekly weigh-ins trending toward the goal.
    const weeklyTrendKg =
      demoClient.goal === "fat_loss" ? -0.4 : demoClient.goal === "muscle_gain" ? 0.15 : 0;
    const bodyStatsRows = Array.from({ length: 8 }, (_, i) => {
      const weeksAgo = 7 - i;
      return {
        user_id: clientId,
        date: isoDaysAgo(weeksAgo * 7),
        weight_kg: Math.round((demoClient.startWeightKg + weeklyTrendKg * i) * 10) / 10,
      };
    });
    await admin.from("body_stats").upsert(bodyStatsRows, { onConflict: "user_id,date" });
    const latestWeightKg = bodyStatsRows[bodyStatsRows.length - 1].weight_kg;

    // 6 weekly training sessions with light progressive overload per lift.
    const liftPlan: [string, number][] = [
      ["Squat", demoClient.liftStart.squat],
      ["Bench Press", demoClient.liftStart.bench],
      ["Deadlift", demoClient.liftStart.deadlift],
      ["Overhead Press", demoClient.liftStart.ohp],
    ];
    const liftRows = liftPlan.flatMap(([liftName, startWeight]) =>
      Array.from({ length: 6 }, (_, i) => {
        const weeksAgo = 5 - i;
        const weight = Math.round((startWeight + i * 1.25) * 2) / 2;
        const reps = 5;
        return {
          user_id: clientId,
          lift_name: liftName,
          date: isoDaysAgo(weeksAgo * 7),
          weight,
          reps,
          sets: 3,
          rpe: 7.5,
          est_1rm: calculateEpley1RM(weight, reps),
        };
      }),
    );
    await admin.from("lifts").insert(liftRows);

    const targets = computeNutritionTargets({
      sex: demoClient.sex,
      dob: demoClient.dob,
      heightCm: demoClient.heightCm,
      weightKg: latestWeightKg,
      activityLevel: demoClient.activityLevel,
      goal: demoClient.goal,
    });
    await admin.from("nutrition_targets").insert({
      user_id: clientId,
      bmr: targets.bmr,
      tdee: targets.tdee,
      calorie_target: targets.calorieTarget,
      protein_g: targets.proteinG,
      carb_g: targets.carbG,
      fat_g: targets.fatG,
      source: "auto",
    });

    await admin.from("food_logs").insert([
      {
        user_id: clientId,
        date: isoDaysAgo(0),
        meal: "breakfast",
        food_item: "Oats with whey protein",
        calories: 450,
        protein_g: 35,
        carb_g: 55,
        fat_g: 8,
      },
      {
        user_id: clientId,
        date: isoDaysAgo(0),
        meal: "lunch",
        food_item: "Chicken, rice, vegetables",
        calories: 650,
        protein_g: 50,
        carb_g: 70,
        fat_g: 15,
      },
      {
        user_id: clientId,
        date: isoDaysAgo(1),
        meal: "dinner",
        food_item: "Salmon and sweet potato",
        calories: 700,
        protein_g: 45,
        carb_g: 60,
        fat_g: 25,
      },
    ]);

    await admin.from("supplements").insert([
      {
        user_id: clientId,
        name: "Creatine monohydrate",
        dosage: "5g",
        frequency: "Daily",
        time_of_day: "Any time",
        added_by: "client",
      },
      {
        user_id: clientId,
        name: "Vitamin D3",
        dosage: "2000 IU",
        frequency: "Daily",
        time_of_day: "With breakfast",
        added_by: "coach",
        notes: "Common deficiency in athletes training indoors — supports bone health and immune function.",
      },
    ]);

    console.log(`  ✓ ${demoClient.name} seeded`);
  }

  // One pending meeting request against the coach's roster for realism.
  const firstClientEmail = DEMO_CLIENTS[0].email;
  const { data: users } = await admin.auth.admin.listUsers();
  const firstClientId = users.users.find((u) => u.email === firstClientEmail)?.id;
  if (firstClientId) {
    await admin.from("meeting_requests").insert({
      client_id: firstClientId,
      coach_id: coachId,
      type: "check_in",
      requested_slots: [
        new Date(Date.now() + 2 * 86400000).toISOString(),
        new Date(Date.now() + 3 * 86400000).toISOString(),
      ],
      status: "pending",
      notes: "Want to review this week's squat form.",
    });
  }

  console.log("\nDone. Demo login (all accounts use the same password):");
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Coach:    coach.demo@example.com`);
  for (const c of DEMO_CLIENTS) console.log(`  Client:   ${c.email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
