import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/get-provider";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import type { GenerateReportApiResponse } from "@/lib/ai/provider";
import type { LaunchReportInput } from "@/types/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const inputResult = normalizeLaunchReportInput(payload);

  if (!inputResult.ok) {
    return NextResponse.json({ error: inputResult.error }, { status: 400 });
  }

  const selected = getAIProvider();

  try {
    const report = await selected.provider.generateLaunchReport(inputResult.input);
    const response: GenerateReportApiResponse = {
      report,
      provider: selected.provider.name,
      requestedProvider: selected.requestedProvider,
      isFallback: Boolean(selected.warning),
      isAiGenerated: true,
      warning: selected.warning
    };

    return NextResponse.json(response);
  } catch (error) {
    const mockProvider = new MockAIProvider();
    const fallbackReport = await mockProvider.generateLaunchReport(inputResult.input);
    const warning = [
      selected.provider.name === "openai"
        ? "OpenAIProvider failed. Fallback to MockAIProvider."
        : "AI provider failed. Fallback to MockAIProvider.",
      error instanceof Error ? error.message : "Unknown AI generation error."
    ].join(" ");

    const response: GenerateReportApiResponse = {
      report: fallbackReport,
      provider: "mock",
      requestedProvider: selected.requestedProvider,
      isFallback: true,
      isAiGenerated: true,
      warning
    };

    return NextResponse.json(response);
  }
}

type InputResult =
  | {
      ok: true;
      input: LaunchReportInput;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeLaunchReportInput(payload: unknown): InputResult {
  if (!isRecord(payload)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const productName = readString(payload, "productName");
  const category = readString(payload, "category");
  const features = readString(payload, "features");
  const cost = readNumber(payload, "cost");
  const targetPrice = readNumber(payload, "targetPrice");
  const targetAudience = readString(payload, "targetAudience");
  const brandStyle = readString(payload, "brandStyle");
  const imageUrl = readString(payload, "imageUrl", "/hero-workspace.png");
  const salesChannels = readStringArray(payload, "salesChannels");

  const missing = [
    ["productName", productName],
    ["category", category],
    ["features", features],
    ["targetAudience", targetAudience],
    ["brandStyle", brandStyle]
  ]
    .filter(([, value]) => typeof value !== "string" || value.trim().length === 0)
    .map(([field]) => field);

  if (missing.length > 0) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }

  if (!Number.isFinite(cost) || !Number.isFinite(targetPrice)) {
    return { ok: false, error: "cost and targetPrice must be valid numbers." };
  }

  return {
    ok: true,
    input: {
      productName,
      category,
      features,
      cost,
      targetPrice,
      targetAudience,
      brandStyle,
      salesChannels,
      imageUrl
    }
  };
}

function readString(record: Record<string, unknown>, field: string, fallback = "") {
  const value = record[field];
  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(record: Record<string, unknown>, field: string) {
  const value = record[field];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value.replace(/,/g, "").trim());
  }

  return Number.NaN;
}

function readStringArray(record: Record<string, unknown>, field: string) {
  const value = record[field];

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
