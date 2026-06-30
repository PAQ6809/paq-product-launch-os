"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { HelpChatDrawer } from "@/components/help/HelpChatDrawer";
import type { HelpUiMessage } from "@/components/help/HelpChatMessage";
import type { HelpChatApiResponse } from "@/lib/help/provider";

const maxMessages = 20;

export function HelpChatButton() {
  const locale = useLocale();
  const pathname = usePathname();
  const storageKey = useMemo(() => `paq-help-chat:${locale}`, [locale]);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<HelpUiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      setMessages(normalizeStoredMessages(JSON.parse(raw)));
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-maxMessages)));
    } catch {
      // sessionStorage can be unavailable in private browsing; Help still works for the current render.
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const nextUserMessage: HelpUiMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed
    };
    const history = messages.slice(-maxMessages).map((message) => ({
      role: message.role,
      content: message.content
    }));

    setMessages((current) => [...current, nextUserMessage].slice(-maxMessages));
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/help-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          history,
          locale,
          currentPath: pathname
        })
      });
      const data = (await response.json()) as Partial<HelpChatApiResponse> & {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? `Help request failed with ${response.status}`);
      }

      const assistantMessage: HelpUiMessage = {
        id: createMessageId(),
        role: "assistant",
        content: data.answer ?? "目前無法產生回答，請稍後再試。",
        provider: data.provider,
        isFallback: data.isFallback,
        warning: data.warning,
        relatedLinks: data.relatedLinks ?? []
      };

      setMessages((current) => [...current, assistantMessage].slice(-maxMessages));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI Help 暫時無法回應。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open PAQ AI Help"
        className="floating-help-trigger fixed inline-flex min-h-12 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle size={18} aria-hidden="true" />
        <span>AI Help</span>
      </button>

      {isOpen ? (
        <HelpChatDrawer
          messages={messages}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClose={() => setIsOpen(false)}
          onSend={(message) => void sendMessage(message)}
        />
      ) : null}
    </>
  );
}

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeStoredMessages(value: unknown): HelpUiMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item): HelpUiMessage => {
      const provider = item.provider === "nvidia" || item.provider === "mock" ? item.provider : undefined;
      return {
        id: typeof item.id === "string" ? item.id : createMessageId(),
        role: item.role === "assistant" ? "assistant" : "user",
        content: typeof item.content === "string" ? item.content.slice(0, 1000) : "",
        provider,
        isFallback: typeof item.isFallback === "boolean" ? item.isFallback : undefined,
        warning: typeof item.warning === "string" ? item.warning : undefined,
        relatedLinks: Array.isArray(item.relatedLinks) ? item.relatedLinks : []
      };
    })
    .filter((item) => item.content)
    .slice(-maxMessages);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
