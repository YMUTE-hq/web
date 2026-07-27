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
      
      if (isVerified && result.email) {
        await getResend().emails.send({
          from: EMAIL_SENDERS.AUTH,
          to: result.email,
          subject: "Your Profile is Verified!",
          html: `<p>Congratulations ${result.full_name}, your profile has been approved by YMUTE admin.</p>`,
        });
      }

      return result;
    } catch (e: unknown) {
      throw new Error(`Profile verification failed: ${getErrorMessage(e)}`);
    }
  }

  static async suspendUser(userId: string) {
    try {
      return await UserRepository.adminUpdateUser(userId, { verification_status: "unverified" });
    } catch (e: unknown) {
      throw new Error(`Suspension error: ${getErrorMessage(e)}`);
    }
  }
}
