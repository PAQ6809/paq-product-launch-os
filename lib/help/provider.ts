import type { AppLocale } from "@/i18n/routing";

export type HelpProviderName = "mock" | "nvidia";

export type HelpScope = "site_help" | "account_help" | "security_help" | "out_of_scope";

export type HelpRelatedLink = {
  label: string;
  href: string;
  description?: string;
};

export type HelpChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type HelpUserContextSummary = {
  isLoggedIn: boolean;
  productCount?: number;
  latestDraftExists?: boolean;
  latestProductUpdatedAt?: string | null;
  recentExportCount?: number;
};

export type HelpQuestionInput = {
  message: string;
  history: HelpChatMessage[];
  locale: AppLocale;
  userId?: string;
  currentPath?: string;
  userContextSummary?: HelpUserContextSummary;
  knowledgeBaseContext: string;
  relatedLinks: HelpRelatedLink[];
};

export type HelpAnswer = {
  answer: string;
  scope: HelpScope;
  relatedLinks: HelpRelatedLink[];
  suggestedActions: string[];
  provider: HelpProviderName;
  model: string;
  isFallback: boolean;
  warning?: string;
  answeredAt: string;
};

export type HelpProvider = {
  name: HelpProviderName;
  model: string;
  answerHelpQuestion(input: HelpQuestionInput): Promise<HelpAnswer>;
};

export type HelpChatApiResponse = HelpAnswer & {
  requestedProvider: HelpProviderName;
  rateLimit: {
    enabled: boolean;
    remaining: number;
    resetAt: string;
  };
  publicHelpAIEnabled: boolean;
  forcedMockInProduction: boolean;
};
