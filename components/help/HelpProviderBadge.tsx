"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import type { HelpProviderName } from "@/lib/help/provider";

export function HelpProviderBadge({
  provider,
  isFallback
}: {
  provider: HelpProviderName;
  isFallback?: boolean;
}) {
  const t = useTranslations("help.badge");

  if (isFallback) {
    return <Badge tone="amber">{t("fallback")}</Badge>;
  }

  return <Badge tone={provider === "nvidia" ? "teal" : "amber"}>{provider === "nvidia" ? t("nvidia") : t("mock")}</Badge>;
}
