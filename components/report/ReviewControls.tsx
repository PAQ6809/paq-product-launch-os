"use client";

import { CheckCircle2, Pencil, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import type { ReportReviewStatus } from "@/types";

type ReviewControlsProps = {
  status: ReportReviewStatus;
  isEditing: boolean;
  copyText: string;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
};

export function ReviewControls({
  status,
  isEditing,
  copyText,
  onEdit,
  onApprove,
  onReject
}: ReviewControlsProps) {
  const t = useTranslations("common");
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <CopyButton text={copyText} className="w-full sm:w-auto" />
      <Button className="w-full sm:w-auto" variant="secondary" size="sm" onClick={onEdit} disabled={isEditing}>
        <Pencil size={16} aria-hidden="true" />
        {t("edit")}
      </Button>
      <Button className="w-full sm:w-auto" variant="secondary" size="sm" onClick={onApprove} disabled={status === "approved"}>
        <CheckCircle2 size={16} aria-hidden="true" />
        {t("approve")}
      </Button>
      <Button className="w-full sm:w-auto" variant="danger" size="sm" onClick={onReject} disabled={status === "rejected"}>
        <XCircle size={16} aria-hidden="true" />
        {t("reject")}
      </Button>
    </div>
  );
}
