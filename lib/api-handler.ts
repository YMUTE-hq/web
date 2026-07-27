import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/types";

type ApiHandler<T = unknown> = (req: NextRequest, context?: T) => Promise<NextResponse>;

export function apiHandler<T = unknown>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (req: NextRequest, context?: T) => {
    try {
      return await handler(req, context);
    } catch (error: unknown) {
      console.error(`[API Error] ${req.method} ${req.url}:`, error);
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 }
      );
    }
  };
}
