import { NextResponse } from "next/server";
import { getLatestLaunchReport, listReports, saveLaunchReport, type ReportMetadata } from "@/lib/db/reports";
import { trackWorkspaceEvent } from "@/lib/db/workspace-events";
import { getCurrentUser } from "@/lib/supabase/server";
import type { LaunchReport } from "@/types/report";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const latest = url.searchParams.get("latest") !== "false";

  if (!productId) {
    return NextResponse.json({ error: "MISSING_PRODUCT_ID" }, { status: 400 });
  }

  try {
    const data = latest ? await getLatestLaunchReport(user.id, productId) : await listReports(user.id, productId);
    return NextResponse.json(latest ? { report: data } : { reports: data }, { headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = readReportPayload(payload);
  if (!parsed) {
    return NextResponse.json({ error: "INVALID_REPORT", message: "Missing productId or report payload." }, { status: 400 });
  }

  try {
    const saved = await saveLaunchReport(user.id, parsed.productId, parsed.report, parsed.metadata);
    await trackWorkspaceEvent(user.id, parsed.productId, "report.saved", { provider: parsed.metadata.provider });
    return NextResponse.json({ report: saved, source: "supabase" }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

function readReportPayload(payload: unknown) {
  if (!isRecord(payload)) return null;
  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";
  const report = isLaunchReport(payload.report) ? payload.report : null;
  const metadataSource = isRecord(payload.metadata) ? payload.metadata : payload;
  const provider = readProvider(metadataSource.provider);

  if (!productId || !report || !provider) return null;

  const metadata: ReportMetadata = {
    provider,
    model: typeof metadataSource.model === "string" ? metadataSource.model : undefined,
    isFallback: typeof metadataSource.isFallback === "boolean" ? metadataSource.isFallback : undefined,
    validationPassed: typeof metadataSource.validationPassed === "boolean" ? metadataSource.validationPassed : undefined,
    generatedAt: typeof metadataSource.generatedAt === "string" ? metadataSource.generatedAt : undefined
  };

  return { productId, report, metadata };
}

function isLaunchReport(value: unknown): value is LaunchReport {
  return isRecord(value) && typeof value.productName === "string" && typeof value.positioning === "string" && Array.isArray(value.legalRiskNotes);
}

function readProvider(value: unknown) {
  return value === "mock" || value === "openai" || value === "nvidia" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function authRequired() {
  return NextResponse.json(
    {
      error: "AUTH_REQUIRED",
      message: "Sign in to save reports to the cloud workspace. Anonymous reports remain local."
    },
    { status: 401, headers: noStoreHeaders() }
  );
}

function dbError(error: unknown) {
  return NextResponse.json(
    {
      error: "REPORT_PERSISTENCE_FAILED",
      message: error instanceof Error ? error.message : "Report persistence failed."
    },
    { status: 500, headers: noStoreHeaders() }
  );
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}
