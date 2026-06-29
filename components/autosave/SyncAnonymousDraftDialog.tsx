"use client";

import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importAnonymousDraft } from "@/lib/autosave/draft-sync";
import type { LocalProductDraft } from "@/lib/autosave/local-draft";

type SyncAnonymousDraftDialogProps = {
  draft: LocalProductDraft | null;
  onSynced?: () => void;
};

export function SyncAnonymousDraftDialog({ draft, onSynced }: SyncAnonymousDraftDialogProps) {
  const [message, setMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  if (!draft) return null;

  async function sync() {
    if (!draft) return;
    setIsSyncing(true);
    setMessage("");
    const result = await importAnonymousDraft(draft);
    setIsSyncing(false);

    if (!result.ok) {
      setMessage(result.status === 401 ? "登入後即可同步這份草稿到雲端 workspace。" : result.message);
      return;
    }

    setMessage("已同步到雲端 workspace。");
    onSynced?.();
  }

  return (
    <section className="rounded-md border border-teal-100 bg-teal-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">匿名草稿同步</p>
          <p className="mt-1 text-sm leading-6 text-teal-800">
            登入後可把目前草稿保存到雲端 workspace；未登入時仍會保留在這台裝置。
          </p>
          {message ? <p className="mt-2 text-sm font-semibold text-teal-700">{message}</p> : null}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void sync()} disabled={isSyncing}>
          <CloudUpload size={15} aria-hidden="true" />
          {isSyncing ? "同步中" : "同步草稿"}
        </Button>
      </div>
    </section>
  );
}
