"use client";

import { Cloud, CloudOff, Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { AutosaveStatus } from "@/hooks/useAutosaveProductDraft";

type AutosaveIndicatorProps = {
  status: AutosaveStatus;
  autosavedAt?: string | null;
  message?: string;
};

export function AutosaveIndicator({ status, autosavedAt, message }: AutosaveIndicatorProps) {
  if (status === "idle" && !autosavedAt) return null;

  const config = getConfig(status);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-graphite/68" aria-live="polite">
      <Badge tone={config.tone}>
        <config.icon size={13} aria-hidden="true" className={status === "saving" ? "animate-spin" : undefined} />
        {config.label}
      </Badge>
      {autosavedAt ? <span>{formatTime(autosavedAt)}</span> : null}
      {message && status !== "saved-cloud" ? <span className="break-words">{message}</span> : null}
    </div>
  );
}

function getConfig(status: AutosaveStatus) {
  if (status === "saving") return { label: "Autosaving", tone: "amber" as const, icon: Loader2 };
  if (status === "saved-cloud") return { label: "Saved to cloud", tone: "teal" as const, icon: Cloud };
  if (status === "offline") return { label: "Saved locally", tone: "amber" as const, icon: CloudOff };
  if (status === "failed") return { label: "Local draft only", tone: "coral" as const, icon: CloudOff };
  return { label: "Saved locally", tone: "amber" as const, icon: Save };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
