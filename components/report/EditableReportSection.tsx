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
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(section.content);

  async function copySection() {
    await navigator.clipboard.writeText(`${section.title}\n\n${section.content}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
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
    <article className="surface scroll-mt-24 p-5" id={section.id}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
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

      {copied ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-600">
          <Check size={14} aria-hidden="true" />
          已複製 section
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
              Cancel
            </Button>
            <Button size="sm" onClick={saveContent} disabled={!draftContent.trim()}>
              <Save size={16} aria-hidden="true" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 whitespace-pre-line text-sm leading-7 text-graphite/82">
          {section.content}
        </div>
      )}
    </article>
  );
}
