import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoachNav } from "@/components/layout/CoachNav";

export default async function CoachAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already enforces auth + role for /coach/* — this is a
  // defense-in-depth fallback, not the primary guard.
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "coach") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <CoachNav name={profile.name} />
      <main className="container-page flex-1 py-8">{children}</main>
    </div>
  );
}
