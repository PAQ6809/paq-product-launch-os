"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReportSectionCard } from "@/components/report/ReportSectionCard";
import { ReviewControls } from "@/components/report/ReviewControls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { reviewLabels, riskLabels } from "@/lib/utils";
import type { ReportReviewStatus, ReviewedReportSection } from "@/types";

function getRiskTone(riskLevel: ReviewedReportSection["riskLevel"]) {
  if (riskLevel === "high") return "coral";
  if (riskLevel === "medium") return "amber";
  return "teal";
}

function ReportContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="grid min-w-0 gap-3">
      {blocks.map((block, blockIndex) => {
        const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);

        if (lines.length > 1) {
          return (
            <ul key={`${blockIndex}-${block.slice(0, 20)}`} className="grid gap-2 rounded-md border border-line bg-white p-4 text-sm leading-7 text-graphite/82">
              {lines.map((line, lineIndex) => (
                <li key={`${lineIndex}-${line.slice(0, 20)}`} className="flex min-w-0 gap-2">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                  <span className="min-w-0 break-words">{line.replace(/^\s*(?:[-*•]|\d+[.)、])\s*/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${blockIndex}-${block.slice(0, 20)}`} className="whitespace-pre-wrap break-words text-sm leading-7 text-graphite/82">
            {block}
          </p>
        );
      })}
    </div>
  );
}

type EditableReportSectionProps = {
  section: ReviewedReportSection;
  onSave: (sectionId: string, newContent: string) => void;
  onStatusChange: (sectionId: string, status: Extract<ReportReviewStatus, "approved" | "rejected">) => void;
};

export function EditableReportSection({ section, onSave, onStatusChange }: EditableReportSectionProps) {
  const t = useTranslations("common");
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(section.content);

  function startEditing() {
    setDraftContent(section.content);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftContent(section.content);
    setIsEditing(false);
  }

  function saveContent() {
    if (!draftContent.trim()) return;
    onSave(section.id, draftContent);
    setIsEditing(false);
  }

  return (
    <ReportSectionCard
      id={section.id}
      title={section.title}
      badges={
        <>
          <StatusBadge status="ai-generated" />
          <Badge tone={getRiskTone(section.riskLevel)}>{riskLabels[section.riskLevel]}</Badge>
          <StatusBadge status={section.reviewStatus} label={reviewLabels[section.reviewStatus]} />
          {section.humanEdited ? <Badge tone="amber">human_edited</Badge> : null}
        </>
      }
      actions={
        <ReviewControls
          status={section.reviewStatus}
          isEditing={isEditing}
          copyText={`${section.title}\n\n${section.content}`}
          onEdit={startEditing}
          onApprove={() => onStatusChange(section.id, "approved")}
          onReject={() => onStatusChange(section.id, "rejected")}
        />
      }
    >
      {isEditing ? (
        <div className="grid gap-3">
          <textarea
            aria-label={`${t("edit")} ${section.title}`}
            className="min-h-56 w-full max-w-full resize-y rounded-md border border-line bg-white p-3 text-sm leading-7 text-ink shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEditing}>
              <X size={16} aria-hidden="true" />
              {t("cancel")}
            </Button>
            <Button size="sm" onClick={saveContent} disabled={!draftContent.trim()}>
              <Save size={16} aria-hidden="true" />
              {t("save")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-line bg-mist/70 p-4 sm:p-5">
          <ReportContent content={section.content} />
        </div>
      )}
    </ReportSectionCard>
  );
}
