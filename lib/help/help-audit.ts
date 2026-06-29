import "server-only";

import { trackSecurityEvent } from "@/lib/security/audit";
import type { HelpProviderName, HelpScope } from "@/lib/help/provider";

export type HelpChatAuditEvent =
  | "help_chat_asked"
  | "help_chat_rate_limited"
  | "help_chat_out_of_scope"
  | "help_chat_fallback";

export async function trackHelpChatEvent(input: {
  userId: string | null;
  eventType: HelpChatAuditEvent;
  scope?: HelpScope;
  provider?: HelpProviderName;
  isFallback?: boolean;
  currentPath?: string;
}) {
  try {
    await trackSecurityEvent(input.userId, input.eventType, {
      scope: input.scope,
      provider: input.provider,
      isFallback: input.isFallback,
      currentPath: input.currentPath,
      createdAt: new Date().toISOString()
    });
  } catch {
    // ponytail: audit is best-effort in the demo; production can add durable queue retries.
  }
}
