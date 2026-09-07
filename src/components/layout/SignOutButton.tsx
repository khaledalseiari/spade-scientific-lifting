"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md px-2 py-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      Sign out
    </button>
  );
}
