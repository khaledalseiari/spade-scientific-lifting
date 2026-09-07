import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientNav } from "@/components/layout/ClientNav";

export default async function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already enforces auth for these routes — this redirect is a
  // defense-in-depth fallback, not the primary guard.
  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <ClientNav name={profile?.name ?? "Athlete"} />
      <main className="container-page flex-1 py-8">{children}</main>
    </div>
  );
}
