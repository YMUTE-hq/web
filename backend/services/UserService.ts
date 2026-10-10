import { UserRepository } from "../repositories/UserRepository";
import { getResend, EMAIL_SENDERS } from "@/lib/resend";
import { getErrorMessage } from "@/types";

export class UserService {
  static async getUserProfile(userId: string) {
    try {
      return await UserRepository.getUserById(userId);
    } catch (e: unknown) {
      throw new Error(`Failed to fetch user: ${getErrorMessage(e)}`);
    }
  }

  static async getAdministrativeUserList(filters?: { role?: string; verification_status?: string }) {
    try {
      return await UserRepository.getAllUsers(filters);
    } catch (e: unknown) {
      throw new Error(`Admin fetch failed: ${getErrorMessage(e)}`);
    }
  }

  static async verifyCaster(casterId: string, isVerified: boolean) {
    try {
      const result = await UserRepository.adminUpdateUser(casterId, { verification_status: isVerified ? "verified" : "rejected" });
      
      if (isVerified && result?.email && typeof result.email === "string" && result.email.includes("@")) {
        const safeName = String(result.full_name ?? "there")
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        await getResend().emails.send({
          from: EMAIL_SENDERS.AUTH,
          to: result.email,
          subject: "Your Profile is Verified!",
          html: `<p>Congratulations ${safeName}, your profile has been approved by YMUTE admin.</p>`,
        });
      }

      return result;
    } catch (e: unknown) {
      throw new Error(`Profile verification failed: ${getErrorMessage(e)}`);
    }
  }

  static async suspendUser(userId: string) {
    try {
      return await UserRepository.adminUpdateUser(userId, { is_suspended: true });
    } catch (e: unknown) {
      throw new Error(`Suspension error: ${getErrorMessage(e)}`);
    }
  }
}
