import { generateMockLaunchReport } from "@/lib/ai/mock-generate-launch-report";
import { PRODUCT_LAUNCH_SYSTEM_PROMPT } from "@/lib/ai/prompts/product-launch-system-prompt";
import { buildProductLaunchUserPrompt } from "@/lib/ai/prompts/product-launch-user-prompt";
import { assertValidLaunchReport } from "@/lib/ai/validators/launch-report-validator";
import type { LaunchReport, LaunchReportInput } from "@/types/report";

export type AIProviderName = "mock" | "openai";

export type GenerateLaunchReportOptions = {
  requestId?: string;
  userId?: string;
  productId?: string;
  model?: string;
};

export type AIProvider = {
  name: AIProviderName;
  generateLaunchReport(
    input: LaunchReportInput,
    options?: GenerateLaunchReportOptions
  ): Promise<LaunchReport>;
};

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateLaunchReport(input: LaunchReportInput) {
    return assertValidLaunchReport(generateMockLaunchReport(input));
  }
}

export type OpenAIProviderConfig = {
  apiKey?: string;
  model?: string;
  organizationId?: string;
  projectId?: string;
  requestTimeoutMs?: number;
};

type OpenAIRequestPreview = {
  provider: "openai";
  model: string;
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
  responseContract: "json_object_only";
  safetyNotes: string[];
};

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(private readonly config: OpenAIProviderConfig = {}) {}

  buildRequestPreview(input: LaunchReportInput, options: GenerateLaunchReportOptions = {}): OpenAIRequestPreview {
    return {
      provider: "openai",
      model: options.model ?? this.config.model ?? "TODO_SELECT_MODEL_AT_IMPLEMENTATION_TIME",
      messages: [
        {
          role: "system",
          content: PRODUCT_LAUNCH_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: buildProductLaunchUserPrompt(input)
        }
      ],
      responseContract: "json_object_only",
      safetyNotes: [
        "Do not call external APIs from this placeholder.",
        "Keep API keys only in server-side environment variables.",
        "Validate JSON with validateLaunchReportPayload before saving or rendering.",
        "Write ai_generation_logs after request start, success, failure, and human review handoff."
      ]
    };
  }

  async generateLaunchReport(
    input: LaunchReportInput,
    options: GenerateLaunchReportOptions = {}
  ): Promise<LaunchReport> {
    this.buildRequestPreview(input, options);

    // TODO:
    // 1. Instantiate the OpenAI SDK only in a server-only module or API route.
    // 2. Read the API key from process.env.OPENAI_API_KEY; never expose it to client components.
    // 3. Send PRODUCT_LAUNCH_SYSTEM_PROMPT and buildProductLaunchUserPrompt(input).
    // 4. Require JSON-only output from the model.
    // 5. Parse and validate the response with validateLaunchReportPayload.
    // 6. Store ai_generation_logs with request id, model, prompt version, token usage, status, and errors.
    // 7. Return only validated LaunchReport objects to the UI.
    throw new Error("OpenAIProvider is a placeholder in Phase 6 and does not call external APIs yet.");
  }
}

export function createAIProvider(name: AIProviderName, config?: OpenAIProviderConfig): AIProvider {
  if (name === "openai") {
    return new OpenAIProvider(config);
  }

  return new MockAIProvider();
}
