import { createAdminClient } from "@/lib/supabase-server";

export class AdminRepository {
  private static get db() {
    return createAdminClient();
  }

  // ─── USERS ───────────────────────────────────────────
  static async getAllUsers(filters?: { role?: string; search?: string }) {
    let query = this.db.from("users").select("*").order("created_at", { ascending: false });
    if (filters?.role) query = query.eq("role", filters.role);
    if (filters?.search) query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateUser(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await this.db.from("users").update(updates).eq("id", userId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteUser(userId: string) {
    const { error } = await this.db.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return true;
  }

  // ─── JOBS ────────────────────────────────────────────
  static async getAllJobs(filters?: { status?: string; search?: string }) {
    let query = this.db
      .from("jobs")
      .select("*, users!company_id(company_name, email)")
      .order("created_at", { ascending: false });
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateJob(jobId: string, updates: Record<string, unknown>) {
    const { data, error } = await this.db.from("jobs").update(updates).eq("id", jobId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteJob(jobId: string) {
    const { error } = await this.db.from("jobs").delete().eq("id", jobId);
    if (error) throw new Error(error.message);
    return true;
  }

  // ─── APPLICATIONS ────────────────────────────────────
  static async getAllApplications(filters?: { status?: string }) {
    let query = this.db
      .from("applications")
      .select("*, jobs(id, title, domain), users!caster_id(id, full_name, email, avatar_url)")
      .order("created_at", { ascending: false });
    if (filters?.status) query = query.eq("status", filters.status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateApplication(appId: string, updates: Record<string, unknown>) {
    const { data, error } = await this.db.from("applications").update(updates).eq("id", appId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteApplication(appId: string) {
    const { error } = await this.db.from("applications").delete().eq("id", appId);
    if (error) throw new Error(error.message);
    return true;
  }

  // ─── PAYMENTS ────────────────────────────────────────
  static async getAllPayments(filters?: { status?: string }) {
    let query = this.db
      .from("payments")
      .select("*, jobs(title), users!caster_id(full_name, email)")
      .order("created_at", { ascending: false });
    if (filters?.status) query = query.eq("status", filters.status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async updatePayment(paymentId: string, updates: Record<string, unknown>) {
    const { data, error } = await this.db.from("payments").update(updates).eq("id", paymentId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ─── REPORTS ─────────────────────────────────────────
  static async getAllReports(filters?: { status?: string }) {
    let query = this.db
      .from("reports")
      .select("*, users!reporter_id(full_name, email)")
      .order("created_at", { ascending: false });
    if (filters?.status) query = query.eq("status", filters.status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateReport(reportId: string, updates: Record<string, unknown>) {
    const { data, error } = await this.db.from("reports").update(updates).eq("id", reportId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ─── COMMUNITY MODERATION (RATINGS & LEADERBOARD) ──
  static async getAllRatings() {
    const { data, error } = await this.db
      .from("ratings")
      .select("*, users!user_id(full_name, email), casters:users!caster_id(full_name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteRating(ratingId: string) {
    const { error } = await this.db.from("ratings").delete().eq("id", ratingId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async getLeaderboard() {
    const { data, error } = await this.db
      .from("leaderboard")
      .select("*, users!user_id(full_name, email, role, avatar_url)")
      .order("points", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateLeaderboardPoints(leaderboardId: string, points: number) {
    const { data, error } = await this.db
      .from("leaderboard")
      .update({ points })
      .eq("id", leaderboardId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ─── SETTINGS ────────────────────────────────────────
  static async getSettings() {
    const { data, error } = await this.db.from("platform_settings").select("*").order("key");
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateSetting(key: string, value: string) {
    const { data, error } = await this.db
      .from("platform_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ─── STATS ───────────────────────────────────────────
  static async getStats() {
    const [users, jobs, apps, payments] = await Promise.all([
      this.db.from("users").select("id, role", { count: "exact" }),
      this.db.from("jobs").select("id, status", { count: "exact" }),
      this.db.from("applications").select("id, status", { count: "exact" }),
      this.db.from("payments").select("amount, status"),
    ]);

    const totalRevenue = payments.data
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return {
      totalUsers: users.count || 0,
      totalCasters: users.data?.filter((u) => u.role === "caster").length || 0,
      totalCompanies: users.data?.filter((u) => u.role === "company").length || 0,
      totalJobs: jobs.count || 0,
      openJobs: jobs.data?.filter((j) => j.status === "open").length || 0,
      totalApplications: apps.count || 0,
      pendingApplications: apps.data?.filter((a) => a.status === "pending").length || 0,
      totalRevenue,
    };
  }
}
