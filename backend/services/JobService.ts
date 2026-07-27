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

    const newJob = {
      ...jobData,
      company_id: user.id,
      payment_type: jobData.payment_type || "fixed",
      status: jobData.status || "open",
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
