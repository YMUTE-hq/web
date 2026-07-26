import { AdminRepository } from "../repositories/AdminRepository";

export class AdminService {
  // ─── STATS ───────────────────────────────────────────
  static async getStats() {
    try {
      return await AdminRepository.getStats();
    } catch {
      return {
        totalUsers: 0,
        totalCasters: 0,
        totalCompanies: 0,
        totalJobs: 0,
        openJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        totalRevenue: 0,
      };
    }
  }

  // ─── USERS ───────────────────────────────────────────
  static async getUsers(filters?: { role?: string; search?: string }) {
    try {
      return (await AdminRepository.getAllUsers(filters)) || [];
    } catch {
      return [];
    }
  }

  static async suspendUser(userId: string) {
    return AdminRepository.updateUser(userId, { is_suspended: true });
  }

  static async unsuspendUser(userId: string) {
    return AdminRepository.updateUser(userId, { is_suspended: false });
  }

  static async banUser(userId: string) {
    return AdminRepository.updateUser(userId, { is_banned: true, is_suspended: true });
  }

  static async updateUser(userId: string, updates: Record<string, unknown>) {
    return AdminRepository.updateUser(userId, updates);
  }

  static async deleteUser(userId: string) {
    return AdminRepository.deleteUser(userId);
  }

  // ─── CASTERS ─────────────────────────────────────────
  static async getCasters(filters?: { search?: string }) {
    try {
      return (await AdminRepository.getAllUsers({ role: "caster", ...filters })) || [];
    } catch {
      return [];
    }
  }

  static async verifyCaster(casterId: string) {
    return AdminRepository.updateUser(casterId, { verification_status: "verified" });
  }

  static async unVerifyCaster(casterId: string) {
    return AdminRepository.updateUser(casterId, { verification_status: "unverified" });
  }

  static async featureCaster(casterId: string, featured: boolean) {
    return AdminRepository.updateUser(casterId, { is_featured: featured });
  }

  // ─── COMPANIES ───────────────────────────────────────
  static async getCompanies(filters?: { search?: string }) {
    try {
      return (await AdminRepository.getAllUsers({ role: "company", ...filters })) || [];
    } catch {
      return [];
    }
  }

  static async verifyCompany(companyId: string) {
    return AdminRepository.updateUser(companyId, { verification_status: "verified" });
  }

  static async rejectCompanyVerification(companyId: string) {
    return AdminRepository.updateUser(companyId, { verification_status: "rejected" });
  }

  // ─── JOBS ────────────────────────────────────────────
  static async getJobs(filters?: { status?: string; search?: string }) {
    try {
      return (await AdminRepository.getAllJobs(filters)) || [];
    } catch {
      return [];
    }
  }

  static async approveJob(jobId: string) {
    return AdminRepository.updateJob(jobId, { status: "open", admin_approved: true });
  }

  static async rejectJob(jobId: string) {
    return AdminRepository.updateJob(jobId, { status: "closed", admin_approved: false });
  }

  static async flagJob(jobId: string, flagged: boolean) {
    return AdminRepository.updateJob(jobId, { flagged });
  }

  static async deleteJob(jobId: string) {
    return AdminRepository.deleteJob(jobId);
  }

  // ─── APPLICATIONS ────────────────────────────────────
  static async getApplications(filters?: { status?: string }) {
    try {
      return (await AdminRepository.getAllApplications(filters)) || [];
    } catch {
      return [];
    }
  }

  static async overrideApplicationStatus(appId: string, status: string) {
    return AdminRepository.updateApplication(appId, { status });
  }

  static async deleteApplication(appId: string) {
    return AdminRepository.deleteApplication(appId);
  }

  // ─── PAYMENTS ────────────────────────────────────────
  static async getPayments(filters?: { status?: string }) {
    try {
      return (await AdminRepository.getAllPayments(filters)) || [];
    } catch {
      return [];
    }
  }

  static async markPaymentPaid(paymentId: string) {
    return AdminRepository.updatePayment(paymentId, { status: "paid" });
  }

  static async refundPayment(paymentId: string) {
    return AdminRepository.updatePayment(paymentId, { status: "refunded" });
  }

  // ─── REPORTS ─────────────────────────────────────────
  static async getReports(filters?: { status?: string }) {
    try {
      return (await AdminRepository.getAllReports(filters)) || [];
    } catch {
      return [];
    }
  }

  static async resolveReport(reportId: string, adminId: string) {
    return AdminRepository.updateReport(reportId, { status: "resolved", resolved_by: adminId });
  }

  static async dismissReport(reportId: string, adminId: string) {
    return AdminRepository.updateReport(reportId, { status: "dismissed", resolved_by: adminId });
  }

  // ─── COMMUNITY MODERATION ────────────────────────────
  static async getCommunityPosts() {
    try {
      return (await AdminRepository.getAllRatings()) || [];
    } catch {
      return [];
    }
  }

  static async deleteCommunityPost(postId: string) {
    return AdminRepository.deleteRating(postId);
  }

  static async getLeaderboard() {
    try {
      return (await AdminRepository.getLeaderboard()) || [];
    } catch {
      return [];
    }
  }

  static async updateLeaderboardPoints(leaderboardId: string, points: number) {
    return AdminRepository.updateLeaderboardPoints(leaderboardId, points);
  }

  // ─── SETTINGS ────────────────────────────────────────
  static async getSettings() {
    try {
      return (await AdminRepository.getSettings()) || [];
    } catch {
      return [];
    }
  }

  static async updateSetting(key: string, value: string) {
    return AdminRepository.updateSetting(key, value);
  }
}
