import { createClient, createAdminClient } from "@/lib/supabase-server";

export class ApplicationRepository {
  static async getCasterApplications(casterId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs(id, title, event_date, domain), users!caster_id(id, full_name, avatar_url, bio, languages, domains, audio_sample_url)")
      .eq("caster_id", casterId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async getCompanyApplications(companyId: string, jobId?: string) {
    const supabase = await createClient();
    let query = supabase
      .from("applications")
      .select("*, jobs!inner(id, title, event_date, domain, company_id), users!caster_id(id, full_name, avatar_url, bio, languages, domains, audio_sample_url)")
      .eq("jobs.company_id", companyId)
      .order("created_at", { ascending: false });

    if (jobId) {
      query = query.eq("job_id", jobId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async checkExistingApplication(jobId: string, casterId: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("caster_id", casterId)
      .single();
    return !!data;
  }

  static async createApplication(jobId: string, casterId: string, message: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applications")
      .insert({ job_id: jobId, caster_id: casterId, message, status: "pending" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Admin access
  static async adminGetAllApplications() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(title), users!caster_id(full_name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async adminOverrideStatus(applicationId: string, status: string) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("applications")
      .update({ status })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
