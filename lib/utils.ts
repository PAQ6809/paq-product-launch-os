import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LifecycleStatus, ReviewStatus, RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const lifecycleSteps: LifecycleStatus[] = [
  "idea",
  "research",
  "positioning",
  "packaging",
  "listing",
  "marketing",
  "launched",
  "optimizing"
];

export const lifecycleLabels: Record<LifecycleStatus, string> = {
  idea: "商品想法",
  research: "市場研究",
  positioning: "商品定位",
  packaging: "包裝設計",
  listing: "上架文案",
  marketing: "行銷推廣",
  launched: "正式上市",
  optimizing: "銷售優化",
  archived: "已封存"
};

export const reviewLabels: Record<ReviewStatus, string> = {
  draft: "draft",
  reviewed: "reviewed",
  approved: "approved",
  rejected: "rejected"
};

export const riskLabels: Record<RiskLevel, string> = {
  low: "低風險",
  medium: "中風險",
  high: "高風險"
};

export function formatCurrency(value: number) {
  const amount = new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0
  }).format(value);

  return `NT$${amount}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getMarginRate(cost: number, price: number) {
  if (!cost || !price) {
    return 0;
  }

  return Math.round(((price - cost) / price) * 100);
}
