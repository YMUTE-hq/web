import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendCasterHired } from "@/lib/resend";
import { ChatService } from "@/backend/services/ChatService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { status } = body;

  // Verify company owns this application's job
  const { data: app } = await supabase
    .from("applications")
    .select("job_id, caster_id, jobs(company_id)")
    .eq("id", id)
    .single() as { data: { job_id: string; caster_id: string; jobs: { company_id: string } } | null };

  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if ((app.jobs as { company_id: string })?.company_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If accepted, reject all others for same job and send email
  if (status === "accepted") {
    await supabase
      .from("applications")
      .update({ status: "rejected" })
      .eq("job_id", app.job_id)
      .neq("id", id);

    // Send hired notification
    try {
      const { data: caster } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", app.caster_id)
        .single();
      const { data: job } = await supabase
        .from("jobs")
        .select("title, users!company_id(company_name)")
        .eq("id", app.job_id)
        .single() as { data: { title: string; users: { company_name: string } } | null };

      if (caster && caster.email && job) {
        await sendCasterHired({
          casterEmail: caster.email,
          casterName: caster.full_name || "Caster",
          jobTitle: job.title,
          companyName: (job.users as { company_name: string })?.company_name || "Company",
        });

        // Auto-create chat conversation and send welcome message
        try {
          const { conversationId } = await ChatService.getOrCreateDirectConversation(user.id, app.caster_id);
          await ChatService.sendMessage(
            conversationId,
            user.id,
            `Hi! I have accepted your application for the job "${job.title}". Looking forward to working with you! Let's use this chat to coordinate the casting details, setup checks, and scheduling.`
          );
        } catch (chatError) {
          console.error("Auto-chat creation error:", chatError);
        }
      }
    } catch (e) {
      console.error("Email error:", e);
    }
  }

  return NextResponse.json(data);
}
