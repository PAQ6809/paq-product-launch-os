"use client";

import { useCallback, useEffect, useState } from "react";
import { readCachedTranslation, writeCachedTranslation } from "@/lib/translation/cache";
import type { TranslateReportApiResponse } from "@/lib/translation/provider";
import type { LaunchReport, TranslationLocale, TranslationProviderName, TranslationResult } from "@/types/report";

export function useReportTranslation({ reportId, report, sourceLocale, targetLocale }: { reportId: string; report: LaunchReport; sourceLocale: TranslationLocale; targetLocale: TranslationLocale }) {
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cacheHit, setCacheHit] = useState(false);

  useEffect(() => {
    const cached = readCachedTranslation(reportId, targetLocale, report);
    setTranslation(cached);
    setCacheHit(Boolean(cached));
    setError("");
  }, [report, reportId, targetLocale]);

  const translate = useCallback(async (providerPreference?: TranslationProviderName) => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/translate-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ report, sourceLocale, targetLocale, productCategory: report.category, providerPreference }) });
      const payload = await response.json() as TranslateReportApiResponse & { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Translation failed.");
      setTranslation(payload.translation); setCacheHit(false); writeCachedTranslation(reportId, payload.translation, report);
      return payload;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Translation failed."; setError(message); throw reason;
    } finally { setLoading(false); }
  }, [report, reportId, sourceLocale, targetLocale]);

  return { translation, setTranslation, loading, error, cacheHit, translate };
}
