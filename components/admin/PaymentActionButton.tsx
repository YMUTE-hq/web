"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentActionButton({ paymentId, action, label, className }: { paymentId: string; action: string; label: string; className: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, status: action }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${className}`}>
      {loading ? "..." : label}
    </button>
  );
}
