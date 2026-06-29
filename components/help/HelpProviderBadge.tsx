import { Badge } from "@/components/ui/Badge";
import type { HelpProviderName } from "@/lib/help/provider";

export function HelpProviderBadge({
  provider,
  isFallback
}: {
  provider: HelpProviderName;
  isFallback?: boolean;
}) {
  if (isFallback) {
    return <Badge tone="amber">Fallback</Badge>;
  }

  return <Badge tone={provider === "nvidia" ? "teal" : "amber"}>{provider === "nvidia" ? "NVIDIA Help" : "Mock Help"}</Badge>;
}
