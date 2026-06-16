"use client";

import { useState } from "react";
import { Clipboard, Download, FileJson, Package, Share2, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportLaunchReportJson } from "@/lib/export/export-json";
import { exportLaunchReportMarkdown } from "@/lib/export/export-markdown";
import { exportPinkoiProductTemplate } from "@/lib/export/export-pinkoi";
import { exportShopeeProductTemplate } from "@/lib/export/export-shopee";
import { exportShopifyProductTemplate } from "@/lib/export/export-shopify";
import { exportSocialPostPack } from "@/lib/export/export-social-pack";
import type { LaunchReport } from "@/types";

type ExportButtonGroupProps = {
  report: LaunchReport;
  fileBaseName: string;
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

export function ExportButtonGroup({ report, fileBaseName }: ExportButtonGroupProps) {
  const [copiedTarget, setCopiedTarget] = useState("");

  async function copyTemplate(label: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedTarget(label);
    window.setTimeout(() => setCopiedTarget(""), 1800);
  }

  return (
    <section className="surface p-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-600">
          Export
        </p>
        <h2 className="mt-2 text-lg font-semibold text-ink">匯出與平台貼上模板</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/72">
          目前不串平台 API，只產生可下載或可複製的模板。正式上架前仍需確認法規、商標、版權與平台規則。
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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

      {copiedTarget ? (
        <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-600">
          已複製 {copiedTarget} 模板
        </p>
      ) : null}
    </section>
  );
}
