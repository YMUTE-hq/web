import { UserRepository } from "../repositories/UserRepository";
import { resend } from "@/lib/resend";

export class UserService {
  // Service connecting repository retrieval methods
  static async getUserProfile(userId: string) {
    try {
      return await UserRepository.getUserById(userId);
    } catch (e: any) {
      throw new Error(`Failed to fetch user: ${e.message}`);
    }
  }

  // Admin capabilities wrapped in a service
  static async getAdministrativeUserList(filters?: { role?: string; verification_status?: string }) {
    try {
      // Logic could be expanded here to mask sensitive info or aggregate datasets
      return await UserRepository.getAllUsers(filters);
    } catch (e: any) {
      throw new Error(`Admin fetch failed: ${e.message}`);
    }
  }

  // Handling complex verification requests 
  static async verifyCaster(casterId: string, isVerified: boolean) {
    try {
      const result = await UserRepository.adminUpdateUser(casterId, { verification_status: isVerified ? "verified" : "rejected" });
      
      // If accepted, theoretically we could trigger Resend email to notify the caster here
      if (isVerified && result.email) {
        await resend.emails.send({
          from: "YMUTE Admin <admin@ymute.com>", // Replace with verified domain
          to: result.email,
          subject: "Your Profile is Verified!",
          html: `<p>Congratulations ${result.full_name}, your profile has been approved by YMUTE admin.</p>`,
        });
      }

      return result;
    } catch (e: any) {
      throw new Error(`Profile verification failed: ${e.message}`);
    }
  }

  // Handling Bans and Suspensions
  static async suspendUser(userId: string) {
    // A more thorough schema would use an enum or a `status` field like "suspended" instead of just a boolean, 
    // but assuming there is an access-blocking logic or we can manipulate role:
    try {
      // We could add an "is_suspended" field in Supabase. For now, removing their verification:
      return await UserRepository.adminUpdateUser(userId, { verification_status: "unverified" });
    } catch (e: any) {
      throw new Error(`Suspension error: ${e.message}`);
    }
  }
}
