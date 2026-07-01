"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function HelpQuickPrompts({
  disabled,
  onSelect
}: {
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}) {
  const t = useTranslations("help.quickPrompts");
  const quickPrompts = [
    t("createProduct"),
    t("exportFormats"),
    t("whyLogin"),
    t("autosave"),
    t("dataSafety"),
    t("collectionReport")
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {quickPrompts.map((prompt) => (
        <Button
          key={prompt}
          variant="secondary"
          size="sm"
          className="justify-start text-left"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
