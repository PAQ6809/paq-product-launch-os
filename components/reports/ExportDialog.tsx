"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const formats = ["markdown", "json", "html", "csv", "zip"] as const;
type ExportFormat = (typeof formats)[number];

export function ExportDialog({ productId }: { productId: string }) {
  const [message, setMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  async function exportReport(format: ExportFormat) {
    setIsExporting(true);
    setMessage("");
    try {
      const response = await fetch("/api/exports/product-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, format })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(readMessage(data) ?? `Export failed with ${response.status}.`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${productId}-professional-report.${format === "markdown" ? "md" : format === "zip" ? "json" : format}`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Professional export generated. Review before sharing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Export Professional Report</h2>
          <p className="mt-2 text-sm leading-6 text-graphite/72">
            Requires a signed-in cloud workspace product. Each export writes an audit event and includes a confidentiality notice.
          </p>
          {message ? <p className="mt-3 rounded-md border border-line bg-mist px-3 py-2 text-sm font-semibold text-graphite/78">{message}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {formats.map((format) => (
            <Button key={format} type="button" variant="secondary" size="sm" onClick={() => void exportReport(format)} disabled={isExporting}>
              <Download size={15} aria-hidden="true" />
              {format.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function readMessage(data: unknown) {
  if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
    return data.error;
  }

  return null;
}
