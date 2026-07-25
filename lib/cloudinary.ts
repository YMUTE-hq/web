import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `ymute/${folder}`, resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      )
      .end(fileBuffer);
  });
}

export default cloudinary;
