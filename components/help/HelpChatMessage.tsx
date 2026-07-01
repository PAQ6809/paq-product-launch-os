"use client";

import { useTranslations } from "next-intl";
import { HelpProviderBadge } from "@/components/help/HelpProviderBadge";
import { HelpRelatedLinks } from "@/components/help/HelpRelatedLinks";
import type { HelpProviderName, HelpRelatedLink } from "@/lib/help/provider";

export type HelpUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: HelpProviderName;
  isFallback?: boolean;
  warning?: string;
  relatedLinks?: HelpRelatedLink[];
};

export function HelpChatMessage({ message }: { message: HelpUiMessage }) {
  const t = useTranslations("help");
  const isAssistant = message.role === "assistant";

  return (
    <article className={isAssistant ? "rounded-md border border-line bg-white p-3" : "ml-auto max-w-[90%] rounded-md bg-ink p-3 text-white"}>
      <div className="flex flex-wrap items-center gap-2">
        <p className={isAssistant ? "text-xs font-semibold text-graphite/55" : "text-xs font-semibold text-white/72"}>
          {isAssistant ? t("assistantLabel") : t("userLabel")}
        </p>
        {isAssistant && message.provider ? (
          <HelpProviderBadge provider={message.provider} isFallback={message.isFallback} />
        ) : null}
      </div>
      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
        {message.content}
      </div>
      {message.warning ? (
        <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
          {message.warning}
        </p>
      ) : null}
      {isAssistant ? <HelpRelatedLinks links={message.relatedLinks ?? []} /> : null}
    </article>
  );
}
