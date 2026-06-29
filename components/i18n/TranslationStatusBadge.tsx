"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";

export type TranslationStatus = "original" | "ai" | "mock" | "cached" | "fallback" | "failed";

const tones = {
  original: "neutral",
  ai: "teal",
  mock: "amber",
  cached: "teal",
  fallback: "amber",
  failed: "coral"
} as const;

export function TranslationStatusBadge({ status }: { status: TranslationStatus }) {
  const t = useTranslations("status");
  return <Badge tone={tones[status]}>{t(status)}</Badge>;
}
