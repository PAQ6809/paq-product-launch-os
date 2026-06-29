import { NextResponse } from "next/server";
import { isSupportedLocale } from "@/lib/translation/supported-locales";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_TRANSLATION_TOOLS !== "true") {
    return NextResponse.json({ error: "DEV_TRANSLATION_TOOL_DISABLED" }, { status: 403 });
  }
  const payload = await request.json().catch(() => null) as { targetLocale?: string; entries?: Array<{ key: string; value: string }> } | null;
  if (!payload || !payload.targetLocale || !isSupportedLocale(payload.targetLocale) || !Array.isArray(payload.entries)) {
    return NextResponse.json({ error: "Invalid targetLocale or entries." }, { status: 400 });
  }
  // ponytail: this endpoint prepares keyed copy for review; committed messages remain the source of truth.
  return NextResponse.json({ targetLocale: payload.targetLocale, entries: payload.entries, provider: "mock", warning: "Development preview only. Review and commit approved translations manually." });
}
