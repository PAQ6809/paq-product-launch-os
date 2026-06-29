"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type CollectionRow = {
  id: string;
  title: string;
  description?: string | null;
  product_ids: string[];
  template_id?: string | null;
  created_at?: string;
};

const formats = ["markdown", "json", "html", "csv", "zip"] as const;

export function CollectionDetail({ collectionId }: { collectionId: string }) {
  const [collection, setCollection] = useState<CollectionRow | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch(`/api/report-collections/${collectionId}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { collection?: CollectionRow } | null) => setCollection(data?.collection ?? null));
  }, [collectionId]);

  async function exportCollection(format: (typeof formats)[number]) {
    setMessage("");
    const response = await fetch("/api/exports/collection-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId, format })
    });

    if (!response.ok) {
      setMessage(response.status === 401 ? "Sign in to export this collection." : "Collection export failed.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${collectionId}-collection.${format === "markdown" ? "md" : format === "zip" ? "json" : format}`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Collection export generated.");
  }

  if (!collection) {
    return <section className="surface p-5">Collection not found, or sign in is required.</section>;
  }

  return (
    <div className="grid gap-6">
      <section className="surface p-5 sm:p-6">
        <p className="text-sm font-semibold text-teal-700">{collection.template_id ?? "portfolio-overview"}</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{collection.title}</h1>
        <p className="mt-2 text-sm leading-6 text-graphite/72">{collection.description ?? "Professional report collection."}</p>
        <p className="mt-3 text-sm font-semibold text-graphite/75">{collection.product_ids.length} products selected</p>
      </section>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Export Collection</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {formats.map((format) => (
            <Button key={format} type="button" variant="secondary" size="sm" onClick={() => void exportCollection(format)}>
              {format.toUpperCase()}
            </Button>
          ))}
        </div>
        {message ? <p className="mt-3 text-sm font-semibold text-graphite/75">{message}</p> : null}
      </section>
    </div>
  );
}
