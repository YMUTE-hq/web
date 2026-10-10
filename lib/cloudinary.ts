import { v2 as cloudinary } from "cloudinary";

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("[Cloudinary] Missing CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET — uploads will fail");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "auto" = "auto"
): Promise<string> {
  // Sanitize folder to prevent directory traversal
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!sanitizedFolder) throw new Error("Invalid upload folder");

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `ymute/${sanitizedFolder}`, resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else if (!result?.secure_url) reject(new Error("Upload failed: no URL returned"));
          else resolve(result.secure_url);
        }
      )
      .end(fileBuffer);
  });
}

export default cloudinary;
