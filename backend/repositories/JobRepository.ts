import { createClient, createAdminClient } from "@/lib/supabase-server";

export interface JobFilters {
  domain?: string | null;
  language?: string | null;
  search?: string | null;
  limit?: number;
}

export class JobRepository {
  static async getOpenJobs(filters: JobFilters) {
    const supabase = await createClient();
    let query = supabase
      .from("jobs")
      .select("*, users!company_id(id, full_name, company_name, avatar_url, verification_status)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(filters.limit || 20);

    if (filters.domain) query = query.eq("domain", filters.domain);
    if (filters.language) query = query.ilike("language", `%${filters.language}%`);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

    const { data, error } = await query;
    if (error) {
      console.error("[JobRepository getOpenJobs Error]:", error);
      throw new Error(error.message);
    }
    return data || [];
  }

  static async getJobById(jobId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, users!company_id(id, full_name, company_name, avatar_url, verification_status)")
      .eq("id", jobId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async createJob(jobData: Record<string, unknown>) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert(jobData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Admin access
  static async adminGetAllJobs() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select("*, users!company_id(company_name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async adminUpdateJobStatus(jobId: string, status: string) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("jobs")
      .update({ status })
      .eq("id", jobId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async adminDeleteJob(jobId: string) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("jobs").delete().eq("id", jobId);
    if (error) throw new Error(error.message);
    return true;
  }
}
