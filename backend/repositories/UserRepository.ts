import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-server";

export class UserRepository {
  // Method meant to be called from normal requests executing securely with RLS
  static async getUserById(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  }

  // Admin access to all users using the Service Key
  static async getAllUsers(filters?: { role?: string; verification_status?: string }) {
    const supabaseAdmin = createAdminClient();
    let query = supabaseAdmin.from("users").select("*");

    if (filters?.role) {
      query = query.eq("role", filters.role);
    }
    if (filters?.verification_status) {
      query = query.eq("verification_status", filters.verification_status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  // Method to manually update a user's record via Admin permissions
  static async adminUpdateUser(userId: string, updates: Record<string, unknown>) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
