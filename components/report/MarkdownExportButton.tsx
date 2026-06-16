"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildReportMarkdown } from "@/lib/markdown";
import type { Product, ReportSection } from "@/types";

export function MarkdownExportButton({
  product,
  sections
}: {
  product: Product;
  sections: ReportSection[];
}) {
  function exportMarkdown() {
    const markdown = buildReportMarkdown(product, sections);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${product.id}-launch-report.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="primary" onClick={exportMarkdown}>
      <Download size={17} aria-hidden="true" />
      匯出 Markdown
    </Button>
  );
}
