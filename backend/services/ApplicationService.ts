import { ApplicationRepository } from "../repositories/ApplicationRepository";
import { sendApplicationSubmitted } from "@/lib/resend";
import { createClient } from "@/lib/supabase-server";

export class ApplicationService {
  static async getApplications(user: any, profile: any, jobId?: string) {
    try {
      if (profile.role === "caster") {
        return await ApplicationRepository.getCasterApplications(user.id);
      } else if (profile.role === "company") {
        return await ApplicationRepository.getCompanyApplications(user.id, jobId);
      }
      throw new Error("Invalid role for viewing applications");
    } catch (e: any) {
      throw new Error(`Failed to fetch applications: ${e.message}`);
    }
  }

  static async submitApplication(user: any, profile: any, body: any) {
    if (profile.role !== "caster") {
      throw new Error("Only casters can apply");
    }

    const { job_id, message } = body;
    if (!job_id) throw new Error("Missing job_id");

    const exists = await ApplicationRepository.checkExistingApplication(job_id, user.id);
    if (exists) {
      throw new Error("You have already applied to this job");
    }

    try {
      const application = await ApplicationRepository.createApplication(job_id, user.id, message);

      // STEP 11: Create Job-based conversation automatically
      try {
        const { ChatService } = await import("./ChatService");
        const supabase = await createClient();
        const { data: job } = await supabase
          .from("jobs")
          .select("company_id")
          .eq("id", job_id)
          .single();
        if (job) {
          await ChatService.createConversation(
            "job",
            [user.id, job.company_id],
            job_id
          );
        }
      } catch (chatError) {
        console.error("Failed to create chat conversation for application:", chatError);
        // Do not fail the application itself
      }

      // Attempt Email Notification
      try {
        const supabase = await createClient();
        const { data: job } = await supabase.from("jobs")
          .select("title, users!company_id(company_name)")
          .eq("id", job_id)
          .single() as { data: { title: string; users: { company_name: string } } | null };

        if (job && profile.email) {
          await sendApplicationSubmitted({
            casterEmail: profile.email,
            casterName: profile.full_name || "Caster",
            jobTitle: job.title,
            companyName: (job.users as { company_name: string })?.company_name || "Company",
          });
        }
      } catch (emailError) {
        console.error("Email error:", emailError);
      }

      return application;
    } catch (e: any) {
      throw new Error(`Application submission failed: ${e.message}`);
    }
  }

  // Admin capabilities
  static async adminGetApplications() {
    try {
      return await ApplicationRepository.adminGetAllApplications();
    } catch (e: any) {
      throw new Error(`Admin fetch failed: ${e.message}`);
    }
  }

  static async adminOverrideStatus(applicationId: string, status: string) {
    try {
      return await ApplicationRepository.adminOverrideStatus(applicationId, status);
    } catch (e: any) {
      throw new Error(`Status override failed: ${e.message}`);
    }
  }
}
