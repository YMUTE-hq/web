import { JobRepository } from "../repositories/JobRepository";

export class JobService {
  static async getOpenJobs(filters: any) {
    try {
      return await JobRepository.getOpenJobs(filters);
    } catch (e: any) {
      throw new Error(`Failed to fetch jobs: ${e.message}`);
    }
  }

  static async getJobDetails(jobId: string) {
    try {
      return await JobRepository.getJobById(jobId);
    } catch (e: any) {
      throw new Error(`Failed to fetch job: ${e.message}`);
    }
  }

  static async createJob(user: any, jobData: any) {
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
    } catch (e: any) {
      throw new Error(`Job creation failed: ${e.message}`);
    }
  }

  // Admin Methods 
  static async adminGetJobs() {
    try {
      return await JobRepository.adminGetAllJobs();
    } catch (e: any) {
      throw new Error(`Admin fetch failed: ${e.message}`);
    }
  }

  static async adminApproveJob(jobId: string) {
    try {
      return await JobRepository.adminUpdateJobStatus(jobId, "open");
    } catch (e: any) {
      throw new Error(`Job approval failed: ${e.message}`);
    }
  }

  static async adminDeleteJob(jobId: string) {
    try {
      return await JobRepository.adminDeleteJob(jobId);
    } catch (e: any) {
      throw new Error(`Job deletion failed: ${e.message}`);
    }
  }
}
