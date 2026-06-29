import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { HelpChatButton } from "@/components/help/HelpChatButton";
import { Header } from "@/components/layout/Header";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");

  return (
    <div className="min-h-screen bg-[var(--background)] text-ink">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t("main")}
      </a>
      <Header />
      <main id="main-content" className="min-h-[calc(100vh-4rem)] overflow-x-clip" tabIndex={-1}>
        {children}
      </main>
      <HelpChatButton />
    </div>
  );
}
