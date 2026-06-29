"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";
import { Link } from "@/i18n/navigation";

type CollectionRow = {
  id: string;
  title: string;
  description?: string | null;
  product_ids: string[];
  updated_at?: string;
};

export function CollectionBuilder() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("Launch Portfolio Report");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [productsResponse, collectionsResponse] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/report-collections", { cache: "no-store" })
    ]);
    if (productsResponse.ok) {
      const data = (await productsResponse.json()) as { products?: Product[] };
      setProducts(data.products ?? []);
    }
    if (collectionsResponse.ok) {
      const data = (await collectionsResponse.json()) as { collections?: CollectionRow[] };
      setCollections(data.collections ?? []);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/report-collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, productIds: selected, templateId: "portfolio-overview" })
    });

    if (!response.ok) {
      setMessage(response.status === 401 ? "Sign in to create cloud report collections." : "Collection create failed.");
      return;
    }

    setMessage("Collection created.");
    setSelected([]);
    await refresh();
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={create} className="surface grid gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">Create Collection Report</h2>
          <p className="mt-2 text-sm leading-6 text-graphite/72">Select signed-in cloud products and group them into a professional portfolio report.</p>
        </div>
        <input className="min-h-11 rounded-md border border-line px-3 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} />
        <div className="grid gap-2">
          {products.map((product) => (
            <label key={product.id} className="flex gap-2 rounded-md border border-line bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(product.id)}
                onChange={(event) => {
                  setSelected((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id));
                }}
              />
              <span>{product.name}</span>
            </label>
          ))}
        </div>
        <Button type="submit" disabled={selected.length === 0}>Create Collection Report</Button>
        {message ? <p className="text-sm font-semibold text-graphite/75">{message}</p> : null}
      </form>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Report Collections</h2>
        <div className="mt-4 grid gap-3">
          {collections.length === 0 ? <p className="text-sm text-graphite/70">No collections yet.</p> : null}
          {collections.map((collection) => (
            <Link key={collection.id} href={`/reports/collections/${collection.id}`} className="rounded-md border border-line bg-white p-4 text-sm font-semibold text-ink hover:border-teal-200">
              {collection.title} · {collection.product_ids.length} products
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
