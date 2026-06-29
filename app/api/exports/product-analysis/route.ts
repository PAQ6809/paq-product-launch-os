import { NextResponse } from "next/server";
import { createExportJob, updateExportJobStatus, type ExportFormat } from "@/lib/db/export-jobs";
import { getProduct } from "@/lib/db/products";
import { getLatestDecryptedLaunchReport } from "@/lib/db/secure-reports";
import { exportCsvSummary } from "@/lib/export/export-csv-summary";
import { exportProductAnalysisHtml } from "@/lib/export/export-product-analysis-html";
import { exportProductAnalysisJson } from "@/lib/export/export-product-analysis-json";
import { exportProductAnalysisMarkdown } from "@/lib/export/export-product-analysis-markdown";
import { exportZipPackage } from "@/lib/export/export-zip-package";
import { normalizeReportToTemplate } from "@/lib/report-builder/normalize-report-to-template";
import { trackExportEvent } from "@/lib/security/audit";
import { isSameOriginRequest, sameOriginError } from "@/lib/security/same-origin";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

  const product = await getProduct(user.id, input.productId);
  if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 403 });

  const reportRow = await getLatestDecryptedLaunchReport(user.id, input.productId);
  if (!reportRow?.report) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });

  const normalized = normalizeReportToTemplate(product, reportRow.report, {
    provider: reportRow.provider ?? undefined,
    model: reportRow.model ?? undefined,
    validationPassed: reportRow.validation_passed ?? undefined,
    exportedBy: user.email ?? "Workspace owner"
  });
  const exportJob = await createExportJob(user.id, {
    reportType: "product-analysis",
    format: input.format,
    productIds: [input.productId],
    fileName: fileName(product.id, input.format),
    metadata: { productId: input.productId, templateId: normalized.templateId }
  });
  await trackExportEvent(user.id, exportJob.id, { format: input.format, productId: input.productId });

  const response = buildExportResponse(normalized, input.format);
  await updateExportJobStatus(user.id, exportJob.id, "completed", { metadata: { completedInline: true } });
  response.headers.set("X-PAQ-Export-Job-Id", exportJob.id);
  return response;
}

function readExportInput(payload: unknown) {
  if (!isRecord(payload)) return null;
  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";
  const format = readFormat(payload.format);
  if (!productId || !format) return null;
  return { productId, format };
}

function readFormat(value: unknown): ExportFormat | null {
  return value === "markdown" || value === "json" || value === "html" || value === "csv" || value === "zip" ? value : null;
}

function buildExportResponse(report: ReturnType<typeof normalizeReportToTemplate>, format: ExportFormat) {
  if (format === "json") return fileResponse(exportProductAnalysisJson(report), "application/json; charset=utf-8");
  if (format === "html") return fileResponse(exportProductAnalysisHtml(report), "text/html; charset=utf-8");
  if (format === "csv") return fileResponse(exportCsvSummary([report]), "text/csv; charset=utf-8");
  if (format === "zip") {
    return fileResponse(JSON.stringify(exportZipPackage(report), null, 2), "application/json; charset=utf-8");
  }
  return fileResponse(exportProductAnalysisMarkdown(report), "text/markdown; charset=utf-8");
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

function fileName(productId: string, format: ExportFormat) {
  const extension = format === "markdown" ? "md" : format === "zip" ? "json" : format;
  return `${productId}-product-analysis.${extension}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function authRequired() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
