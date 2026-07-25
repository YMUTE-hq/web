import { ApplicationService } from "../services/ApplicationService";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export class ApplicationController {
  static async getApplications(req: Request) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

      const { searchParams } = new URL(req.url);
      const jobId = searchParams.get("job_id");

      const applications = await ApplicationService.getApplications(user, profile, jobId || undefined);
      return NextResponse.json(applications, { status: 200 });
    } catch (e: any) {
      if (e.message.includes("Invalid role")) return NextResponse.json({ error: e.message }, { status: 403 });
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  static async createApplication(req: Request) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile } = await supabase.from("users").select("role, full_name, email").eq("id", user.id).single();
      if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

      if (profile.role !== "caster") return NextResponse.json({ error: "Only casters can apply" }, { status: 403 });

      const body = await req.json();
      const application = await ApplicationService.submitApplication(user, profile, body);
      return NextResponse.json(application, { status: 201 });
    } catch (e: any) {
      if (e.message.includes("already applied")) return NextResponse.json({ error: e.message }, { status: 400 });
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Admin routing
  static async adminGetApplications() {
    try {
      const apps = await ApplicationService.adminGetApplications();
      return NextResponse.json(apps, { status: 200 });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  static async adminOverrideStatus(req: Request) {
    try {
      const body = await req.json();
      if (!body.id || !body.status) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

      const app = await ApplicationService.adminOverrideStatus(body.id, body.status);
      return NextResponse.json(app, { status: 200 });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
}
