import { ShieldCheck } from "lucide-react";

export function ConfidentialityNotice() {
  return (
    <div className="rounded-md border border-amber-100 bg-amber-50 p-4">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm leading-6 text-amber-800">
          Confidential report. Review AI-generated positioning, claims, pricing strategy, and legal notes before sharing or publishing.
        </p>
      </div>
    </div>
  );
}
