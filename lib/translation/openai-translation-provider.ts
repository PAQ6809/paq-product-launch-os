import { AITranslationProvider } from "@/lib/translation/ai-translation-provider";

export class OpenAITranslationProvider extends AITranslationProvider {
  constructor(config: { apiKey: string; model?: string; requestTimeoutMs?: number }) {
    super({ name: "openai", apiKey: config.apiKey, model: config.model ?? "gpt-4.1-mini", requestTimeoutMs: config.requestTimeoutMs });
  }
}
