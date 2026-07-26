import { NextRequest, NextResponse } from "next/server";

type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

export function apiHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      console.error(`[API Error] ${req.method} ${req.url}:`, error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  };
}
