import { Badge } from "@/components/ui/Badge";

export type StatusBadgeStatus =
  | "demo"
  | "mock"
  | "ai-generated"
  | "fallback"
  | "approved"
  | "reviewed"
  | "draft"
  | "rejected";

const statusConfig: Record<StatusBadgeStatus, { label: string; tone: "neutral" | "teal" | "amber" | "coral" }> = {
  demo: { label: "Demo Mode", tone: "teal" },
  mock: { label: "Mock AI", tone: "amber" },
  "ai-generated": { label: "AI generated", tone: "teal" },
  fallback: { label: "Fallback", tone: "coral" },
  approved: { label: "Approved", tone: "teal" },
  reviewed: { label: "Reviewed", tone: "amber" },
  draft: { label: "Draft", tone: "neutral" },
  rejected: { label: "Rejected", tone: "coral" }
};

export function StatusBadge({ status, label }: { status: StatusBadgeStatus; label?: string }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{label ?? config.label}</Badge>;
}
