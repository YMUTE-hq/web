import { JobService } from "../services/JobService";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/types";

export class JobController {
  static async getJobs(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const filters = {
        domain: searchParams.get("domain"),
        language: searchParams.get("language"),
        search: searchParams.get("search"),
        limit: parseInt(searchParams.get("limit") || "20", 10),
      };

      const jobs = await JobService.getOpenJobs(filters);
      return NextResponse.json(jobs, { status: 200 });
    } catch (e: unknown) {
      console.error("[JobController GET /api/jobs Error]:", e);
      return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
    }
  }

  static async createJob(req: Request, user: { id: string; [key: string]: unknown }) {
    try {
      const body = await req.json();
      const newJob = await JobService.createJob(user, body);
      return NextResponse.json(newJob, { status: 201 });
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      if (msg.includes("Only companies")) {
        return NextResponse.json({ error: msg }, { status: 403 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Admin Methods
  static async adminGetJobs() {
    try {
      const jobs = await JobService.adminGetJobs();
      return NextResponse.json(jobs, { status: 200 });
    } catch (e: unknown) {
      return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
    }
  }

  static async adminApproveJob(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

      const job = await JobService.adminApproveJob(id);
      return NextResponse.json(job, { status: 200 });
    } catch (e: unknown) {
      return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
    }
  }
}
