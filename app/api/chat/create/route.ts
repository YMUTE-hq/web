import { NextRequest } from "next/server";
import { ChatController } from "@/backend/controllers/chatController";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  // Tier 2 Rate Limit: Max 10 conversation creations per minute per IP
  const rateCheck = checkRateLimit(request, {
    prefix: "chat_create",
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!rateCheck.allowed && rateCheck.response) {
    return rateCheck.response;
  }

  return await ChatController.createConversation(request as unknown as Request);
}
