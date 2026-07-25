import { NextRequest } from "next/server";
import { ChatController } from "@/backend/controllers/chatController";

export async function POST(request: NextRequest) {
  return await ChatController.createConversation(request as unknown as Request);
}

