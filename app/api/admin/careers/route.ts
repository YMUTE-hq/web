import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getErrorMessage } from "@/types";

async function requireAdmin(_req?: NextRequest) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return null;
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return null;
    return user;
  } catch (error: unknown) {
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("careers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, {
      prefix: "admin_careers",
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const { title, department, location, type, description, requirements, salary_range, apply_email, apply_url, status } = body;

    if (!title || !department || !description) {
      return NextResponse.json({ error: "Title, department, and description are required fields." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("careers")
      .insert({
        title,
        department,
        location: location || "Remote",
        type: type || "Full-time",
        description,
        requirements: requirements || "",
        salary_range: salary_range || "Competitive",
        apply_email: apply_email || "careers@ymute.com",
        apply_url: apply_url || null,
        status: status || "open"
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
