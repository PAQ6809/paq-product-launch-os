"use client";

import { useEffect, useRef, useState } from "react";
import {
  clearLocalProductDraft,
  hasMeaningfulDraft,
  loadLocalProductDraft,
  saveLocalProductDraft,
  storeLocalProductDraft,
  type LocalProductDraft
} from "@/lib/autosave/local-draft";
import { loadLatestCloudDraft, syncDraftToCloud } from "@/lib/autosave/draft-sync";
import type { NewProductDraft } from "@/types";

export type AutosaveStatus = "idle" | "saving" | "saved-local" | "saved-cloud" | "offline" | "failed";

export function useAutosaveProductDraft(draft: NewProductDraft, options?: { debounceMs?: number; enabled?: boolean }) {
  const debounceMs = options?.debounceMs ?? 1200;
  const enabled = options?.enabled ?? true;
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [localDraft, setLocalDraft] = useState<LocalProductDraft | null>(null);
  const [resumableDraft, setResumableDraft] = useState<LocalProductDraft | null>(null);
  const draftKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stored = loadLocalProductDraft();
    if (stored) {
      draftKeyRef.current = stored.draftKey;
      setLocalDraft(stored);
      setResumableDraft(stored);
    }

    void loadLatestCloudDraft().then((cloudDraft) => {
      if (cancelled || !cloudDraft || !isNewerDraft(cloudDraft, stored)) return;
      setResumableDraft(cloudDraft);
      setMessage("Cloud draft available.");
    });

    return () => {
      cancelled = true;
    };
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
    setResumableDraft(null);

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
    const stored = resumableDraft ?? loadLocalProductDraft();
    if (!stored) return null;
    const localCopy = { ...stored, source: "local" as const };
    draftKeyRef.current = stored.draftKey;
    storeLocalProductDraft(localCopy);
    setLocalDraft(localCopy);
    setResumableDraft(null);
    return stored;
  }

  function discardDraft() {
    clearLocalProductDraft();
    draftKeyRef.current = null;
    setLocalDraft(null);
    setResumableDraft(null);
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
    resumableDraft,
    autosavedAt: localDraft?.autosavedAt ?? null,
    resumeDraft,
    discardDraft,
    saveNow
  };
}

function isNewerDraft(candidate: LocalProductDraft, current: LocalProductDraft | null) {
  if (!current) return true;
  return new Date(candidate.autosavedAt).getTime() > new Date(current.autosavedAt).getTime();
}
