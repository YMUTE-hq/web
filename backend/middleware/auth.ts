import { createClient } from "@/lib/supabase-server";

export async function authenticate(req: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  return {
    id: user.id,
    role: profile.role || "user",
    email: user.email,
  };
}
