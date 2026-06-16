"use client";

import { CheckCircle2, Copy, Pencil, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReportReviewStatus } from "@/types";

type ReviewControlsProps = {
  status: ReportReviewStatus;
  isEditing: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
};

export function ReviewControls({
  status,
  isEditing,
  onCopy,
  onEdit,
  onApprove,
  onReject
}: ReviewControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={onCopy}>
        <Copy size={16} aria-hidden="true" />
        Copy
      </Button>
      <Button variant="secondary" size="sm" onClick={onEdit} disabled={isEditing}>
        <Pencil size={16} aria-hidden="true" />
        Edit
      </Button>
      <Button variant="secondary" size="sm" onClick={onApprove} disabled={status === "approved"}>
        <CheckCircle2 size={16} aria-hidden="true" />
        Approve
      </Button>
      <Button variant="danger" size="sm" onClick={onReject} disabled={status === "rejected"}>
        <XCircle size={16} aria-hidden="true" />
        Reject
      </Button>
    </div>
  );
}
