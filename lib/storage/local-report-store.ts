import type { AIProviderName } from "@/lib/ai/provider";
import type { LaunchReport } from "@/types/report";

const REPORT_STORAGE_KEY = "paq-product-launch-os:v0.3:reports";
const STORAGE_VERSION = 3;

export type StoredLaunchReport = {
  productId: string;
  report: LaunchReport;
  provider: AIProviderName;
  requestedProvider: AIProviderName;
  isFallback: boolean;
  isAiGenerated: true;
  warning?: string;
  generatedAt: string;
};

type StoredReportState = {
  version: number;
  reports: StoredLaunchReport[];
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isStoredLaunchReport(value: unknown): value is StoredLaunchReport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const report = value as Partial<StoredLaunchReport>;

  return Boolean(
    report.productId &&
      report.report &&
      report.provider &&
      report.requestedProvider &&
      report.generatedAt
  );
}

function readReports() {
  if (!canUseLocalStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(REPORT_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredReportState>;
    return Array.isArray(parsed.reports) ? parsed.reports.filter(isStoredLaunchReport) : [];
  } catch {
    return [];
  }
}

function saveReports(reports: StoredLaunchReport[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  const state: StoredReportState = {
    version: STORAGE_VERSION,
    reports
  };

  window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(state));
}

export function upsertStoredLaunchReport(report: StoredLaunchReport) {
  const current = readReports();
  const next = current.some((item) => item.productId === report.productId)
    ? current.map((item) => (item.productId === report.productId ? report : item))
    : [report, ...current];

  saveReports(next);
  return next;
}

export function findStoredLaunchReport(productId: string) {
  return readReports().find((item) => item.productId === productId) ?? null;
}
