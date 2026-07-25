import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "misc";
  const resourceType = (formData.get("resource_type") as "image" | "video" | "raw" | "auto") || "auto";
  const fieldToUpdate = formData.get("field") as string;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const url = await uploadToCloudinary(buffer, folder, resourceType);

  // If field specified, update user profile
  if (fieldToUpdate && ["avatar_url", "audio_sample_url", "company_logo_url", "company_verification_doc_url"].includes(fieldToUpdate)) {
    await supabase.from("users").update({ [fieldToUpdate]: url }).eq("id", user.id);
  }

  return NextResponse.json({ url });
}
