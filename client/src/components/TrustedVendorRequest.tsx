
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";

type VendorStatus = {
  isTrustedVendor: boolean;
  trustedVendorRequestStatus: string | null;
};

export default function TrustedVendorRequest() {
  const { token } = useAuth();
  const [status, setStatus] = useState<VendorStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    apiRequest("/users/me", { token })
      .then(setStatus)
      .catch(() => toast.error("Could not load trusted-vendor status"));
  }, [token]);

  const apply = async () => {
    if (!token || submitting) return;

    setSubmitting(true);
    try {
      const result = await apiRequest("/users/trusted-vendor-request", {
        method: "POST",
        token,
      });
      setStatus((current) =>
        current
          ? { ...current, trustedVendorRequestStatus: result.trustedVendorRequestStatus }
          : current,
      );
      toast.success("Trusted-vendor request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!status || status.isTrustedVendor) return null;

  if (status.trustedVendorRequestStatus === "pending") {
    return (
      <p className="border-b border-black/10 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-amber-700">
        Trusted-vendor request pending
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={apply}
      disabled={submitting}
      className="w-full border-b border-black/10 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide hover:bg-neutral-50 disabled:opacity-50"
    >
      {submitting ? "Submitting…" : "Apply for trusted-vendor status"}
    </button>
  );
}
