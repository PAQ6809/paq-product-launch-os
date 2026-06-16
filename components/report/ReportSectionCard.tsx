"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ReportSection } from "@/types";
import { reviewLabels, riskLabels } from "@/lib/utils";

function getRiskTone(riskLevel: ReportSection["riskLevel"]) {
  if (riskLevel === "high") {
    return "coral";
  }

  if (riskLevel === "medium") {
    return "amber";
  }

  return "teal";
}

export function ReportSectionCard({ section }: { section: ReportSection }) {
  const [copied, setCopied] = useState(false);

  async function copySection() {
    await navigator.clipboard.writeText(`${section.title}\n\n${section.content}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="surface scroll-mt-24 p-5" id={section.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={getRiskTone(section.riskLevel)}>{riskLabels[section.riskLevel]}</Badge>
            <Badge>{reviewLabels[section.reviewStatus]}</Badge>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void copySection()}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? "已複製" : "Copy"}
        </Button>
      </div>
      <div className="mt-5 whitespace-pre-line text-sm leading-7 text-graphite/82">
        {section.content}
      </div>
    </article>
  );
}
