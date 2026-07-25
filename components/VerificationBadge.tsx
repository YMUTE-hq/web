import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export type VerificationStatus = "verified" | "pending" | "unverified" | "rejected";

export default function VerificationBadge({ status, showText = true }: { status?: VerificationStatus | string | null, showText?: boolean }) {
  const normalizedStatus = (status || "unverified").toLowerCase();

  switch (normalizedStatus) {
    case "verified":
      return (
        <div className="flex items-center gap-1.5 text-blue-500 bg-blue-50/50 px-2.5 py-1 rounded-full border border-blue-100 w-fit">
          <CheckCircle2 className="w-4 h-4 fill-blue-500 text-white" />
          {showText && <span className="text-xs font-bold">Verified</span>}
        </div>
      );
    case "pending":
      return (
        <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50/50 px-2.5 py-1 rounded-full border border-amber-100 w-fit">
          <Clock className="w-4 h-4" />
          {showText && <span className="text-xs font-bold">Verification Pending</span>}
        </div>
      );
    case "rejected":
      return (
        <div className="flex items-center gap-1.5 text-red-500 bg-red-50/50 px-2.5 py-1 rounded-full border border-red-100 w-fit">
          <XCircle className="w-4 h-4" />
          {showText && <span className="text-xs font-bold">Verification Rejected</span>}
        </div>
      );
    case "unverified":
    default:
      return (
        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50/50 px-2.5 py-1 rounded-full border border-slate-200 w-fit">
          <AlertCircle className="w-4 h-4" />
          {showText && <span className="text-xs font-bold">Not Verified</span>}
        </div>
      );
  }
}
