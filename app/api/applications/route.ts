import { NextRequest } from "next/server";
import { ApplicationController } from "@/backend/controllers/ApplicationController";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  return await ApplicationController.getApplications(request as unknown as Request);
}

export async function POST(request: NextRequest) {
  // Tier 1 Rate Limit: Max 5 application submissions per hour per IP
  const rateCheck = checkRateLimit(request, {
    prefix: "application_submit",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateCheck.allowed && rateCheck.response) {
    return rateCheck.response;
  }

  return await ApplicationController.createApplication(request as unknown as Request);
}
