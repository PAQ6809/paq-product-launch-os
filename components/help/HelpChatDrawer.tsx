"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { HelpChatMessage, type HelpUiMessage } from "@/components/help/HelpChatMessage";
import { HelpQuickPrompts } from "@/components/help/HelpQuickPrompts";
import { Button } from "@/components/ui/Button";

export function HelpChatDrawer({
  messages,
  isLoading,
  errorMessage,
  onClose,
  onSend
}: {
  messages: HelpUiMessage[];
  isLoading: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isLoading]);

  function submit() {
    const next = draft.trim();
    if (!next || isLoading) return;
    setDraft("");
    onSend(next);
  }

  return (
    <div className="help-drawer-overlay fixed inset-0" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-ink/20"
        aria-label="Close AI Help overlay"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="PAQ AI Help"
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] min-h-[70vh] flex-col rounded-t-md border border-line bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:min-h-0 sm:w-[28rem] sm:rounded-l-md sm:rounded-tr-none"
      >
        <header className="border-b border-line p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">PAQ Product Launch OS</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">AI Help</h2>
              <p className="mt-1 text-xs leading-5 text-graphite/68">
                此助理僅回答 PAQ Product Launch OS 網站功能與服務相關問題。
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-graphite transition hover:bg-mist hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              aria-label="Close AI Help"
              onClick={onClose}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4" aria-live="polite">
          <div className="grid gap-4">
            {messages.length === 0 ? (
              <div className="rounded-md border border-teal-100 bg-teal-50 p-3 text-sm leading-6 text-teal-700">
                你可以問我如何建立商品、產生報告、匯出檔案、恢復草稿，或了解資料安全設定。
              </div>
            ) : null}

            <HelpQuickPrompts disabled={isLoading} onSelect={onSend} />

            {messages.map((message) => (
              <HelpChatMessage key={message.id} message={message} />
            ))}

            {isLoading ? (
              <div className="inline-flex items-center gap-2 rounded-md border border-line bg-white p-3 text-sm text-graphite/72">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                正在整理回答...
              </div>
            ) : null}

            {errorMessage ? (
              <p className="rounded-md border border-coral-100 bg-coral-100 px-3 py-2 text-sm font-semibold leading-6 text-coral-500">
                {errorMessage}
              </p>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          className="border-t border-line p-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor="paq-help-message">
            Ask PAQ AI Help
          </label>
          <textarea
            id="paq-help-message"
            className="min-h-24 w-full resize-none rounded-md border border-line bg-white p-3 text-sm leading-6 text-ink outline-none transition placeholder:text-graphite/45 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            value={draft}
            placeholder="例如：報告可以匯出哪些格式？"
            maxLength={1000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-graphite/55">不會長期保存完整對話。</p>
            <Button type="submit" disabled={isLoading || !draft.trim()}>
              <Send size={16} aria-hidden="true" />
              Send
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
