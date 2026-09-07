import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const CLIENT_PREFIXES = [
  "/dashboard",
  "/lifting",
  "/nutrition",
  "/supplements",
  "/leaderboard",
  "/consultations",
  "/settings",
  "/onboarding",
];
const COACH_PREFIX = "/coach";

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: this call refreshes the session cookie. Removing it causes
  // random logouts because the access token expires without being renewed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isClientRoute = matchesPrefix(pathname, CLIENT_PREFIXES);
  const isCoachRoute = matchesPrefix(pathname, [COACH_PREFIX]);
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  if (!user) {
    if (isClientRoute || isCoachRoute) {
      const redirectUrl = new URL("/sign-in", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Logged in — only fetch the role/onboarding state when it actually
  // affects routing, to avoid an extra DB round trip on every request.
  if (isClientRoute || isCoachRoute || isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (isAuthPage) {
      return NextResponse.redirect(
        new URL(role === "coach" ? "/coach" : "/dashboard", request.url),
      );
    }

    if (isCoachRoute && role !== "coach") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isClientRoute && role === "coach") {
      return NextResponse.redirect(new URL("/coach", request.url));
    }

    if (isClientRoute && role === "client" && pathname !== "/onboarding") {
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!clientProfile) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
