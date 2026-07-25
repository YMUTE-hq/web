import { NextRequest } from "next/server";
import { ApplicationController } from "@/backend/controllers/ApplicationController";

export async function GET(request: NextRequest) {
  return await ApplicationController.getApplications(request as unknown as Request);
}

export async function POST(request: NextRequest) {
  return await ApplicationController.createApplication(request as unknown as Request);
}
