// Hand-written types mirroring supabase/migrations/*.sql. If you connect a
// real Supabase project, prefer regenerating this with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
//
// NOTE: every row shape below is a `type` alias, never an `interface`. The
// postgrest-js query builder checks these against `Record<string, unknown>`
// (an index signature), and TypeScript only grants plain object type
// aliases the implicit "satisfies an index signature" treatment — a named
// `interface` does not get it (interfaces stay "open" for declaration
// merging, so TS won't assume they match). Using `interface` here silently
// collapses every query's inferred row type to `never`.

export type UserRole = "client" | "coach";
export type SexType = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";
export type GoalType = "fat_loss" | "maintenance" | "muscle_gain";
export type TrainingExperience = "beginner" | "intermediate" | "advanced";
export type TargetSource = "auto" | "coach_override";
export type AddedByType = "client" | "coach";
export type MeetingType =
  | "check_in"
  | "form_review"
  | "nutrition_consult"
  | "general_question";
export type MeetingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "rescheduled_proposed";
export type NotificationType =
  | "meeting_requested"
  | "meeting_scheduled"
  | "meeting_declined"
  | "meeting_reschedule_proposed"
  | "target_flagged"
  | "target_updated";

export type Profile = {
  id: string;
  role: UserRole;
  name: string;
  username: string | null;
  created_at: string;
};

export type ClientProfile = {
  user_id: string;
  coach_id: string | null;
  sex: SexType;
  dob: string;
  height_cm: number;
  activity_level: ActivityLevel;
  goal: GoalType;
  training_experience: TrainingExperience;
  leaderboard_opt_in: boolean;
  created_at: string;
  updated_at: string;
};

export type CoachSettings = {
  coach_id: string;
  leaderboard_enabled: boolean;
};

export type BodyStat = {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  body_fat_pct: number | null;
  created_at: string;
};

export type Lift = {
  id: string;
  user_id: string;
  lift_name: string;
  date: string;
  weight: number;
  reps: number;
  sets: number;
  rpe: number | null;
  est_1rm: number | null;
  created_at: string;
};

export type NutritionTarget = {
  id: string;
  user_id: string;
  date: string;
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  source: TargetSource;
  note: string | null;
  created_at: string;
};

export type FoodLog = {
  id: string;
  user_id: string;
  date: string;
  meal: string;
  food_item: string;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  external_food_id: string | null;
  created_at: string;
};

export type Supplement = {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string | null;
  notes: string | null;
  added_by: AddedByType;
  created_at: string;
};

export type SupplementLog = {
  id: string;
  supplement_id: string;
  date: string;
  taken: boolean;
};

export type MeetingRequest = {
  id: string;
  client_id: string;
  coach_id: string;
  type: MeetingType;
  requested_slots: string[];
  status: MeetingStatus;
  notes: string | null;
  coach_note: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CoachAvailability = {
  id: string;
  coach_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type CoachNote = {
  id: string;
  coach_id: string;
  client_id: string;
  note: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
};

export type LeaderboardRow = {
  display_name: string;
  bodyweight_kg: number | null;
  total_kg: number | null;
  streak_days: number;
  sex: SexType;
};

export type CoachRosterRow = {
  client_id: string;
  name: string;
  adherence_pct: number;
  last_check_in: string | null;
  leaderboard_opt_in: boolean;
};

type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      client_profiles: TableDef<ClientProfile>;
      coach_settings: TableDef<CoachSettings>;
      body_stats: TableDef<BodyStat>;
      lifts: TableDef<Lift>;
      nutrition_targets: TableDef<NutritionTarget>;
      food_logs: TableDef<FoodLog>;
      supplements: TableDef<Supplement>;
      supplement_logs: TableDef<SupplementLog>;
      meeting_requests: TableDef<MeetingRequest>;
      coach_availability: TableDef<CoachAvailability>;
      coach_notes: TableDef<CoachNote>;
      notifications: TableDef<Notification>;
    };
    Views: { [_ in never]: never };
    Functions: {
      get_leaderboard: {
        Args: Record<string, never>;
        Returns: LeaderboardRow[];
      };
      get_coach_roster: {
        Args: Record<string, never>;
        Returns: CoachRosterRow[];
      };
    };
    Enums: {
      user_role: UserRole;
      sex_type: SexType;
      activity_level: ActivityLevel;
      goal_type: GoalType;
      training_experience: TrainingExperience;
      target_source: TargetSource;
      added_by_type: AddedByType;
      meeting_type: MeetingType;
      meeting_status: MeetingStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
