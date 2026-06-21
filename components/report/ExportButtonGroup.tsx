"use client";

import { useState } from "react";
import { Clipboard, Copy, Download, FileJson, Package, Share2, Store } from "lucide-react";
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

export function ExportButtonGroup({ report, fileBaseName }: ExportButtonGroupProps) {
  const [copyMessage, setCopyMessage] = useState("");

  async function copyTemplate(label: string, content: string) {
    const didCopy = await copyText(content);
    setCopyMessage(didCopy ? `已複製 ${label} 內容` : "無法自動複製，請手動選取內容");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  return (
    <section className="surface p-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-600">
          報告匯出
        </p>
        <h2 className="mt-2 text-lg font-semibold text-ink">匯出與平台貼上模板</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/72">
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

      {copyMessage ? (
        <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-600">
          {copyMessage}
        </p>
      ) : null}
    </section>
  );
}
