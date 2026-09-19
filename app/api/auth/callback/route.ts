import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const ALLOWED_SIGNUP_ROLES = ["caster", "company"] as const;
  type AllowedSignupRole = (typeof ALLOWED_SIGNUP_ROLES)[number];

  const rawRole = searchParams.get("role") || "caster";
  const role: AllowedSignupRole = ALLOWED_SIGNUP_ROLES.includes(rawRole as AllowedSignupRole)
    ? (rawRole as AllowedSignupRole)
    : "caster";
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // 1. Fetch user profile from public.users table
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id, role, company_name, full_name, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      const targetRole = existingProfile?.role || role;

      // 2. If new user, create base profile record with Google info
      if (!existingProfile) {
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User";
        const avatarUrl =
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          null;

        await supabase.from("users").upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: role,
          created_at: new Date().toISOString(),
        });
      }

      // 3. Dynamic redirection
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (targetRole === "company") {
        if (!existingProfile?.company_name) {
          return NextResponse.redirect(`${origin}/dashboard/company/profile?onboarding=true`);
        }
        return NextResponse.redirect(`${origin}/dashboard/company`);
      } else if (targetRole === "caster") {
        return NextResponse.redirect(`${origin}/dashboard/caster`);
      } else if (targetRole === "admin") {
        return NextResponse.redirect(`${origin}/dashboard/admin`);
      }

      return NextResponse.redirect(`${origin}/`);
    } else {
      console.error("[OAuth Callback Error]:", error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
