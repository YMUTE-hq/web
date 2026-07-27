import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[Logout API Error]:", err);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  const cookieStore = await cookies();

  // Delete all Supabase Auth cookies explicitly (handles chunked cookies sb-xxx-auth-token.0, .1, etc.)
  const allCookies = cookieStore.getAll();
  for (const c of allCookies) {
    if (c.name.includes("auth-token") || c.name.includes("token") || c.name.startsWith("sb-")) {
      cookieStore.delete(c.name);
      response.cookies.set(c.name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      });
    }
  }

  return response;
}
