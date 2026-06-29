"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export function CopyButton({ text, label, copiedLabel, className }: CopyButtonProps) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const resolvedLabel = label ?? t("copy");
  const resolvedCopiedLabel = copiedLabel ?? t("copied");

  async function handleCopy() {
    const didCopy = await copyToClipboard(text);
    setCopied(didCopy);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={() => void handleCopy()}
      aria-label={copied ? resolvedCopiedLabel : resolvedLabel}
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {copied ? resolvedCopiedLabel : resolvedLabel}
    </Button>
  );
}
