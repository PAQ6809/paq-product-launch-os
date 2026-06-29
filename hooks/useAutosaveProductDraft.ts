"use client";

import { useEffect, useRef, useState } from "react";
import {
  clearLocalProductDraft,
  hasMeaningfulDraft,
  loadLocalProductDraft,
  saveLocalProductDraft,
  type LocalProductDraft
} from "@/lib/autosave/local-draft";
import { syncDraftToCloud } from "@/lib/autosave/draft-sync";
import type { NewProductDraft } from "@/types";

export type AutosaveStatus = "idle" | "saving" | "saved-local" | "saved-cloud" | "offline" | "failed";

export function useAutosaveProductDraft(draft: NewProductDraft, options?: { debounceMs?: number; enabled?: boolean }) {
  const debounceMs = options?.debounceMs ?? 1200;
  const enabled = options?.enabled ?? true;
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [localDraft, setLocalDraft] = useState<LocalProductDraft | null>(null);
  const draftKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = loadLocalProductDraft();
    if (!stored) return;
    draftKeyRef.current = stored.draftKey;
    setLocalDraft(stored);
  }, []);

  useEffect(() => {
    if (!enabled || !hasMeaningfulDraft(draft)) return;

    const timer = window.setTimeout(() => {
      void save(draft);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, draft, enabled]);

  async function save(nextDraft: NewProductDraft) {
    setStatus("saving");
    const saved = saveLocalProductDraft(nextDraft, draftKeyRef.current ?? undefined);
    draftKeyRef.current = saved.draftKey;
    setLocalDraft(saved);

    const cloud = await syncDraftToCloud(saved);
    if (cloud.ok) {
      setStatus("saved-cloud");
      setMessage("Draft saved to cloud workspace.");
      return saved;
    }

    setStatus(cloud.status === 401 ? "saved-local" : cloud.status === 0 ? "offline" : "failed");
    setMessage(cloud.message);
    return saved;
  }

  function resumeDraft() {
    const stored = loadLocalProductDraft();
    if (!stored) return null;
    draftKeyRef.current = stored.draftKey;
    setLocalDraft(stored);
    return stored;
  }

  function discardDraft() {
    clearLocalProductDraft();
    draftKeyRef.current = null;
    setLocalDraft(null);
    setStatus("idle");
    setMessage("");
  }

  async function saveNow() {
    if (!hasMeaningfulDraft(draft)) return null;
    return save(draft);
  }

  return {
    status,
    message,
    localDraft,
    autosavedAt: localDraft?.autosavedAt ?? null,
    resumeDraft,
    discardDraft,
    saveNow
  };
}
