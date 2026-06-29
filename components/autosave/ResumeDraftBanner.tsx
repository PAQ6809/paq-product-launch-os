"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LocalProductDraft } from "@/lib/autosave/local-draft";

type ResumeDraftBannerProps = {
  draft: LocalProductDraft | null;
  onResume: () => void;
  onDiscard: () => void;
};

export function ResumeDraftBanner({ draft, onResume, onDiscard }: ResumeDraftBannerProps) {
  if (!draft) return null;

  return (
    <section className="rounded-md border border-amber-100 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">偵測到尚未完成的本機草稿</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            完成度 {draft.completionPercent}% · 最後保存 {formatTime(draft.autosavedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onResume}>
            <RotateCcw size={15} aria-hidden="true" />
            繼續編輯
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDiscard}>
            <Trash2 size={15} aria-hidden="true" />
            捨棄
          </Button>
        </div>
      </div>
    </section>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
