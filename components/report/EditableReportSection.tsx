"use client";

import { useState } from "react";
import { Check, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReviewControls } from "@/components/report/ReviewControls";
import { reviewLabels, riskLabels } from "@/lib/utils";
import type { ReportReviewStatus, ReviewedReportSection } from "@/types";

function getRiskTone(riskLevel: ReviewedReportSection["riskLevel"]) {
  if (riskLevel === "high") {
    return "coral";
  }

  if (riskLevel === "medium") {
    return "amber";
  }

  return "teal";
}

function getReviewTone(status: ReportReviewStatus) {
  if (status === "approved") {
    return "teal";
  }

  if (status === "rejected") {
    return "coral";
  }

  if (status === "reviewed") {
    return "amber";
  }

  return "neutral";
}

async function copyText(content: string) {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const didCopy = document.execCommand("copy");
    textarea.remove();
    return didCopy;
  }
}

type EditableReportSectionProps = {
  section: ReviewedReportSection;
  onSave: (sectionId: string, newContent: string) => void;
  onStatusChange: (sectionId: string, status: Extract<ReportReviewStatus, "approved" | "rejected">) => void;
};

export function EditableReportSection({
  section,
  onSave,
  onStatusChange
}: EditableReportSectionProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(section.content);

  async function copySection() {
    const didCopy = await copyText(`${section.title}\n\n${section.content}`);
    setCopyMessage(didCopy ? "已複製此段內容" : "無法自動複製，請手動選取內容");
    window.setTimeout(() => setCopyMessage(""), 1600);
  }

  function startEditing() {
    setDraftContent(section.content);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftContent(section.content);
    setIsEditing(false);
  }

  function saveContent() {
    if (!draftContent.trim()) {
      return;
    }

    onSave(section.id, draftContent);
    setIsEditing(false);
  }

  return (
    <article className="surface scroll-mt-24 overflow-hidden p-5" id={section.id}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="teal">AI generated</Badge>
            <Badge tone={getRiskTone(section.riskLevel)}>{riskLabels[section.riskLevel]}</Badge>
            <Badge tone={getReviewTone(section.reviewStatus)}>
              {reviewLabels[section.reviewStatus]}
            </Badge>
            {section.humanEdited ? <Badge tone="amber">human_edited</Badge> : null}
          </div>
        </div>
        <ReviewControls
          status={section.reviewStatus}
          isEditing={isEditing}
          onCopy={() => void copySection()}
          onEdit={startEditing}
          onApprove={() => onStatusChange(section.id, "approved")}
          onReject={() => onStatusChange(section.id, "rejected")}
        />
      </div>

      {copyMessage ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-600">
          <Check size={14} aria-hidden="true" />
          {copyMessage}
        </div>
      ) : null}

      {isEditing ? (
        <div className="mt-5 grid gap-3">
          <textarea
            className="min-h-56 w-full rounded-md border border-line bg-white p-3 text-sm leading-7 text-ink shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEditing}>
              <X size={16} aria-hidden="true" />
              取消
            </Button>
            <Button size="sm" onClick={saveContent} disabled={!draftContent.trim()}>
              <Save size={16} aria-hidden="true" />
              儲存
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-line bg-mist/70 p-4 whitespace-pre-line text-sm leading-7 text-graphite/82">
          {section.content}
        </div>
      )}
    </article>
  );
}
