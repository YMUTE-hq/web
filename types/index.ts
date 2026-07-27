export type UserRole = "caster" | "company" | "user" | "admin";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type JobStatus = "open" | "closed" | "draft";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type ConversationType = "direct" | "job" | "support";
export type CareerStatus = "open" | "closed" | "draft";
export type ReportTargetType = "user" | "job" | "post" | "comment";
export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface UserProfile {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  languages: string[] | null;
  domains: string[] | null;
  audio_sample_url: string | null;
  rating: number;
  company_name: string | null;
  company_logo_url: string | null;
  company_verification_doc_url: string | null;
  verification_status: VerificationStatus;
  is_suspended?: boolean;
  is_banned?: boolean;
  is_featured?: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  domain: string | null;
  language: string | null;
  budget: string | null;
  event_date: string | null;
  event_duration: string | null;
  event_mode: string | null;
  location: string | null;
  description: string | null;
  casters_needed: number;
  payment_type: string | null;
  status: JobStatus;
  admin_approved?: boolean;
  flagged?: boolean;
  approved_by?: string | null;
  created_at: string;
  users?: Partial<UserProfile> | null;
}

export interface Application {
  id: string;
  job_id: string;
  caster_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  job?: Job | null;
  jobs?: Partial<Job> | null;
  caster?: UserProfile | null;
  users?: Partial<UserProfile> | null;
}

export interface Payment {
  id: string;
  job_id: string;
  caster_id: string;
  amount: number | null;
  status: string | null;
  created_at: string;
  job?: Job | null;
  jobs?: Partial<Job> | null;
  caster?: UserProfile | null;
  users?: Partial<UserProfile> | null;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  type?: string;
  link?: string | null;
  created_at: string;
}

export interface RatingItem {
  id: string;
  caster_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  job_id?: string | null;
  created_at: string;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  participant?: UserProfile | null;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  users?: UserProfile | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text?: string | null;
  media_url?: string | null;
  seen?: boolean;
  is_deleted?: boolean;
  created_at: string;
  sender?: UserProfile | null;
}

export interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  apply_email: string | null;
  apply_url: string | null;
  status: CareerStatus;
  created_at: string;
  updated_at: string;
}

export interface ReportItem {
  id: string;
  reporter_id: string | null;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  resolved_by?: string | null;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export function getErrorMessage(error: unknown, fallback: string = "Internal server error"): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}
