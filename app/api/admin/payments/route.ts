import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/backend/services/AdminService";
import { requireAdmin } from "@/backend/middleware/auth";
import { getErrorMessage } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const payments = await AdminService.getPayments({ status: searchParams.get("status") || undefined });
    return NextResponse.json(payments);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const result = status === "paid"
      ? await AdminService.markPaymentPaid(id)
      : await AdminService.refundPayment(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
