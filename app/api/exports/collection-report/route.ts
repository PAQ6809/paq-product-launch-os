import { NextResponse } from "next/server";
import { createExportJob, updateExportJobStatus, type ExportFormat } from "@/lib/db/export-jobs";
import { getProduct } from "@/lib/db/products";
import { getReportCollection } from "@/lib/db/report-collections";
import { getLatestDecryptedLaunchReport } from "@/lib/db/secure-reports";
import { exportCollectionHtml } from "@/lib/export/export-collection-html";
import { exportCollectionJson } from "@/lib/export/export-collection-json";
import { exportCollectionMarkdown, type CollectionExportInput } from "@/lib/export/export-collection-markdown";
import { exportCsvSummary } from "@/lib/export/export-csv-summary";
import { normalizeReportToTemplate } from "@/lib/report-builder/normalize-report-to-template";
import { trackExportEvent } from "@/lib/security/audit";
import { isSameOriginRequest, sameOriginError } from "@/lib/security/same-origin";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CollectionRow = {
  id: string;
  title: string;
  description?: string | null;
  product_ids: string[];
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return sameOriginError();
  const user = await getCurrentUser();
  if (!user) return authRequired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const input = readExportInput(payload);
  if (!input) return NextResponse.json({ error: "INVALID_EXPORT_REQUEST" }, { status: 400 });

  const collection = await getReportCollection(user.id, input.collectionId) as CollectionRow | null;
  if (!collection) return NextResponse.json({ error: "COLLECTION_NOT_FOUND" }, { status: 403 });

  const reports = [];
  for (const productId of collection.product_ids) {
    const product = await getProduct(user.id, productId);
    const reportRow = await getLatestDecryptedLaunchReport(user.id, productId);
    if (product && reportRow?.report) {
      reports.push(normalizeReportToTemplate(product, reportRow.report, { exportedBy: user.email ?? "Workspace owner" }));
    }
  }

  const exportInput: CollectionExportInput = {
    title: collection.title,
    description: collection.description ?? undefined,
    reports
  };
  const exportJob = await createExportJob(user.id, {
    reportType: "collection-report",
    format: input.format,
    productIds: collection.product_ids,
    fileName: `${collection.id}-collection.${input.format}`,
    metadata: { collectionId: collection.id, reportCount: reports.length }
  });
  await trackExportEvent(user.id, exportJob.id, { format: input.format, collectionId: collection.id });
  const response = buildExportResponse(exportInput, input.format);
  await updateExportJobStatus(user.id, exportJob.id, "completed", { metadata: { completedInline: true } });
  response.headers.set("X-PAQ-Export-Job-Id", exportJob.id);
  return response;
}

function readExportInput(payload: unknown) {
  if (!isRecord(payload)) return null;
  const collectionId = typeof payload.collectionId === "string" ? payload.collectionId.trim() : "";
  const format = readFormat(payload.format);
  if (!collectionId || !format) return null;
  return { collectionId, format };
}

function readFormat(value: unknown): ExportFormat | null {
  return value === "markdown" || value === "json" || value === "html" || value === "csv" || value === "zip" ? value : null;
}

function buildExportResponse(collection: CollectionExportInput, format: ExportFormat) {
  if (format === "json" || format === "zip") return fileResponse(exportCollectionJson(collection), "application/json; charset=utf-8");
  if (format === "html") return fileResponse(exportCollectionHtml(collection), "text/html; charset=utf-8");
  if (format === "csv") return fileResponse(exportCsvSummary(collection.reports), "text/csv; charset=utf-8");
  return fileResponse(exportCollectionMarkdown(collection), "text/markdown; charset=utf-8");
}

function fileResponse(content: string, contentType: string) {
  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "Content-Disposition": "attachment"
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function authRequired() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
