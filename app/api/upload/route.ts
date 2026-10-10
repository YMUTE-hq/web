import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getErrorMessage } from "@/types";

interface UploadCategoryConfig {
  maxSize: number; // in bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  folder: string;
  resourceType: "image" | "video" | "auto";
  label: string;
}

const UPLOAD_CONFIGS: Record<string, UploadCategoryConfig> = {
  avatar_url: {
    maxSize: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    folder: "avatars",
    resourceType: "image",
    label: "Avatar image",
  },
  company_logo_url: {
    maxSize: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    folder: "logos",
    resourceType: "image",
    label: "Company logo",
  },
  audio_sample_url: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/aac",
      "video/mp4", // Browsers frequently identify m4a containers as video/mp4
    ],
    allowedExtensions: [".mp3", ".wav", ".ogg", ".m4a", ".aac"],
    folder: "audio_reels",
    resourceType: "video",
    label: "Casting audio reel",
  },
  company_verification_doc_url: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
    folder: "verification_docs",
    resourceType: "auto",
    label: "Verification document",
  },
};

const FOLDER_TO_CONFIG_KEY: Record<string, string> = {
  avatars: "avatar_url",
  avatar: "avatar_url",
  logos: "company_logo_url",
  logo: "company_logo_url",
  audio: "audio_sample_url",
  audio_reels: "audio_sample_url",
  verification_docs: "company_verification_doc_url",
  verification: "company_verification_doc_url",
};

export async function POST(request: NextRequest) {
  try {
    // Tier 1 Rate Limit: Max 5 uploads per 10 minutes per IP
    const rateCheck = await checkRateLimit(request, {
      prefix: "upload",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const fieldParam = formData.get("field") as string | null;
    const folderParam = formData.get("folder") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Determine upload category configuration
    let configKey = fieldParam && UPLOAD_CONFIGS[fieldParam] ? fieldParam : null;
    if (!configKey && folderParam && FOLDER_TO_CONFIG_KEY[folderParam]) {
      configKey = FOLDER_TO_CONFIG_KEY[folderParam];
    }

    if (!configKey) {
      return NextResponse.json(
        { error: "Invalid or unsupported upload destination. Must specify a recognized category." },
        { status: 400 }
      );
    }

    const config = UPLOAD_CONFIGS[configKey];

    // 1. Pre-buffer size guard: check before reading into server RAM
    if (file.size > config.maxSize) {
      const maxMb = config.maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `${config.label} exceeds maximum allowed size of ${maxMb}MB.` },
        { status: 400 }
      );
    }

    // 2. File extension check
    const fileName = file.name || "";
    const lastDotIndex = fileName.lastIndexOf(".");
    const ext = lastDotIndex !== -1 ? fileName.substring(lastDotIndex).toLowerCase() : "";
    if (!config.allowedExtensions.includes(ext)) {
      return NextResponse.json(
        {
          error: `Invalid file extension '${ext}'. Allowed extensions for ${config.label}: ${config.allowedExtensions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 3. MIME type check — always enforce (empty file.type must not bypass)
    const normalizedMime = (file.type || "").toLowerCase();
    if (!normalizedMime || !config.allowedMimeTypes.includes(normalizedMime)) {
      return NextResponse.json(
        {
          error: `Invalid file type '${file.type || "unknown"}'. Allowed formats for ${config.label}: ${config.allowedExtensions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Read file buffer once validated
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload with server-enforced folder and resource type
    const url = await uploadToCloudinary(buffer, config.folder, config.resourceType);

    // Update user profile if targeting an approved profile field
    if (fieldParam && fieldParam in UPLOAD_CONFIGS) {
      const { error: profileError } = await supabase.from("users").update({ [fieldParam]: url }).eq("id", user.id);
      if (profileError) {
        console.error("[Upload] profile update failed:", profileError.message);
        return NextResponse.json({ error: "Upload succeeded but profile update failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ url });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
