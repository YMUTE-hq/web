import { JobRepository, JobFilters } from "../repositories/JobRepository";
import { getErrorMessage } from "@/types";

export class JobService {
  static async getOpenJobs(filters: JobFilters) {
    try {
      return await JobRepository.getOpenJobs(filters);
    } catch (e: unknown) {
      throw new Error(`Failed to fetch jobs: ${getErrorMessage(e)}`);
    }
  }

  static async getJobDetails(jobId: string) {
    try {
      return await JobRepository.getJobById(jobId);
    } catch (e: unknown) {
      throw new Error(`Failed to fetch job: ${getErrorMessage(e)}`);
    }
  }

  static async createJob(user: { id: string; role?: string }, jobData: Record<string, unknown>) {
    if (!user || user.role !== "company") {
      throw new Error("Only companies can post jobs");
    }

    const title = typeof jobData.title === "string" ? jobData.title.trim() : "";
    if (!title || title.length < 3 || title.length > 200) {
      throw new Error("Job title must be 3–200 characters");
    }
    const description = typeof jobData.description === "string" ? jobData.description.trim() : "";
    if (!description || description.length < 10 || description.length > 10000) {
      throw new Error("Job description must be 10–10000 characters");
    }
    const ALLOWED_PAYMENT = ["fixed", "hourly"];
    const payment_type = ALLOWED_PAYMENT.includes(jobData.payment_type as string)
      ? jobData.payment_type
      : "fixed";
    const ALLOWED_STATUS = ["open", "draft"];
    const status = ALLOWED_STATUS.includes(jobData.status as string) ? jobData.status : "open";
    const casters_needed = Number(jobData.casters_needed);
    if (jobData.casters_needed !== undefined && (!Number.isInteger(casters_needed) || casters_needed < 1 || casters_needed > 100)) {
      throw new Error("casters_needed must be an integer 1–100");
    }
    const budgetRaw = jobData.budget;
    const budget = budgetRaw === undefined || budgetRaw === null ? null : Number(budgetRaw);
    if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 10000000)) {
      throw new Error("Invalid budget");
    }

    const newJob = {
      title,
      description,
      domain: typeof jobData.domain === "string" ? jobData.domain.slice(0, 100) : null,
      language: typeof jobData.language === "string" ? jobData.language.slice(0, 100) : null,
      location: typeof jobData.location === "string" ? jobData.location.slice(0, 200) : null,
      event_date: typeof jobData.event_date === "string" ? jobData.event_date : null,
      casters_needed: Number.isInteger(casters_needed) ? casters_needed : 1,
      budget,
      company_id: user.id,
      payment_type,
      status,
    };

    try {
      return await JobRepository.createJob(newJob);
    } catch (e: unknown) {
      throw new Error(`Job creation failed: ${getErrorMessage(e)}`);
    }
  }

  // Admin Methods 
  static async adminGetJobs() {
    try {
      return await JobRepository.adminGetAllJobs();
    } catch (e: unknown) {
      throw new Error(`Admin fetch failed: ${getErrorMessage(e)}`);
    }
  }

  static async adminApproveJob(jobId: string) {
    try {
      return await JobRepository.adminUpdateJobStatus(jobId, "open");
    } catch (e: unknown) {
      throw new Error(`Job approval failed: ${getErrorMessage(e)}`);
    }
  }

  static async adminDeleteJob(jobId: string) {
    try {
      return await JobRepository.adminDeleteJob(jobId);
    } catch (e: unknown) {
      throw new Error(`Job deletion failed: ${getErrorMessage(e)}`);
    }
  }
}
