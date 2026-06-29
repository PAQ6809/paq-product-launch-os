"use client";

import { useState } from "react";
import { Clipboard, Copy, Download, FileJson, Globe2, Package, Share2, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportAmazonEnglishListing } from "@/lib/export/export-amazon-english";
import { exportBilingualMarkdown } from "@/lib/export/export-bilingual-markdown";
import { exportEnglishJson } from "@/lib/export/export-english-json";
import { exportEnglishMarkdown } from "@/lib/export/export-english-markdown";
import { exportEtsyEnglishListing } from "@/lib/export/export-etsy-english";
import { exportLaunchReportJson } from "@/lib/export/export-json";
import { exportLaunchReportMarkdown } from "@/lib/export/export-markdown";
import { exportPinkoiProductTemplate } from "@/lib/export/export-pinkoi";
import { exportShopeeProductTemplate } from "@/lib/export/export-shopee";
import { exportShopifyProductTemplate } from "@/lib/export/export-shopify";
import { exportShopifyEnglishListing } from "@/lib/export/export-shopify-english";
import { exportSocialPostPack } from "@/lib/export/export-social-pack";
import type { LaunchReport, ReportSection, TranslationResult } from "@/types";

type ExportButtonGroupProps = {
  report: LaunchReport;
  fileBaseName: string;
  sourceSections?: ReportSection[];
  translation?: TranslationResult | null;
};

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyText(content: string) {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const didCopy = document.execCommand("copy");
    textarea.remove();
    return didCopy;
  }
}

export function ExportButtonGroup({
  report,
  fileBaseName,
  sourceSections = [],
  translation
}: ExportButtonGroupProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const hasTranslation = Boolean(translation);

  async function copyTemplate(label: string, content: string) {
    const didCopy = await copyText(content);
    setCopyMessage(didCopy ? `已複製 ${label} 內容` : "無法自動複製，請手動選取內容");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  return (
    <section className="surface min-w-0 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-teal-600">
          報告匯出
        </p>
        <h2 className="mt-2 break-words text-lg font-semibold text-ink">匯出與平台貼上模板</h2>
        <p className="mt-2 break-words text-sm leading-6 text-graphite/72">
          目前不串平台 API，只產生可下載或可複製的模板。正式上架前仍需確認法規、商標、版權與平台規則。
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Button
          variant="secondary"
          onClick={() =>
            downloadTextFile(`${fileBaseName}-launch-report.md`, exportLaunchReportMarkdown(report), "text/markdown")
          }
        >
          <Download size={17} aria-hidden="true" />
          Export Markdown
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            downloadTextFile(`${fileBaseName}-launch-report.json`, exportLaunchReportJson(report), "application/json")
          }
        >
          <FileJson size={17} aria-hidden="true" />
          Export JSON
        </Button>
        <Button
          variant="secondary"
          onClick={() => void copyTemplate("完整報告", exportLaunchReportMarkdown(report))}
        >
          <Copy size={17} aria-hidden="true" />
          Copy Full Report
        </Button>
        <Button
          variant="secondary"
          onClick={() => void copyTemplate("Shopify", exportShopifyProductTemplate(report))}
        >
          <Store size={17} aria-hidden="true" />
          Shopify
        </Button>
        <Button
          variant="secondary"
          onClick={() => void copyTemplate("蝦皮", exportShopeeProductTemplate(report))}
        >
          <Package size={17} aria-hidden="true" />
          蝦皮
        </Button>
        <Button
          variant="secondary"
          onClick={() => void copyTemplate("Pinkoi", exportPinkoiProductTemplate(report))}
        >
          <Clipboard size={17} aria-hidden="true" />
          Pinkoi
        </Button>
        <Button
          variant="secondary"
          onClick={() => void copyTemplate("社群貼文包", exportSocialPostPack(report))}
        >
          <Share2 size={17} aria-hidden="true" />
          社群貼文包
        </Button>
      </div>

      {hasTranslation && translation ? (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-teal-600" aria-hidden="true" />
            <h3 className="text-base font-semibold text-ink">{translation.targetLocale} / Bilingual Export</h3>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <Button
              variant="secondary"
              onClick={() =>
                downloadTextFile(`${fileBaseName}-${translation.targetLocale}-report.md`, exportEnglishMarkdown(translation), "text/markdown")
              }
            >
              <Download size={17} aria-hidden="true" />
              Export {translation.targetLocale} Markdown
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadTextFile(
                  `${fileBaseName}-zh-TW-${translation.targetLocale}-report.md`,
                  exportBilingualMarkdown(sourceSections, translation),
                  "text/markdown"
                )
              }
            >
              <Download size={17} aria-hidden="true" />
              Export Bilingual Markdown
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadTextFile(`${fileBaseName}-${translation.targetLocale}-report.json`, exportEnglishJson(translation), "application/json")
              }
            >
              <FileJson size={17} aria-hidden="true" />
              Export {translation.targetLocale} JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => void copyTemplate("Shopify English Listing", exportShopifyEnglishListing(translation))}
            >
              <Store size={17} aria-hidden="true" />
              Shopify {translation.targetLocale}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void copyTemplate("Amazon-style English Listing", exportAmazonEnglishListing(translation))}
            >
              <Package size={17} aria-hidden="true" />
              Amazon-style {translation.targetLocale}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void copyTemplate("Etsy-style English Listing", exportEtsyEnglishListing(translation))}
            >
              <Clipboard size={17} aria-hidden="true" />
              Etsy-style {translation.targetLocale}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 min-h-10" aria-live="polite">
        {copyMessage ? (
          <p className="break-words rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-600">
            {copyMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
