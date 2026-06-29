"use client";

import { useEffect, useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { sampleProducts } from "@/data/sample-products";
import { loadDemoProducts, upsertDemoProduct } from "@/lib/storage/local-demo-store";
import type { Product } from "@/types";
import { Link } from "@/i18n/navigation";

export function ProductsHistory() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [workspaceMode, setWorkspaceMode] = useState<"local" | "cloud">("local");

  useEffect(() => {
    setProducts(loadDemoProducts());
    void loadCloudProducts();
  }, []);

  async function loadCloudProducts() {
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) {
        setWorkspaceMode("local");
        return;
      }

      const data = (await response.json()) as { products?: Product[] };
      if (!Array.isArray(data.products)) return;

      data.products.forEach((product) => upsertDemoProduct(product));
      setProducts(mergeProducts(loadDemoProducts(), data.products));
      setWorkspaceMode("cloud");
    } catch {
      setWorkspaceMode("local");
    }
  }

  const userProductCount = useMemo(() => Math.max(0, products.length - sampleProducts.length), [products.length]);

  return (
    <div className="grid min-w-0 gap-8">
      <PageHeader
        eyebrow={<Badge tone={workspaceMode === "cloud" ? "teal" : "amber"}>{workspaceMode === "cloud" ? "Cloud workspace" : "Local demo"}</Badge>}
        title="商品歷史"
        description="集中查看 Demo 商品、這台裝置建立的商品，以及登入後同步到 Supabase workspace 的商品。"
        actions={
          <Link
            href="/products/new"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-graphite sm:w-auto"
          >
            <PackagePlus size={16} aria-hidden="true" />
            建立商品企劃
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="全部商品" value={products.length} />
        <Metric label="本機/雲端新增" value={userProductCount} />
        <Metric label="Demo 商品" value={sampleProducts.length} />
      </section>

      {products.length === 0 ? (
        <EmptyState
          title="尚未建立商品企劃"
          description="建立第一個商品後，這裡會顯示狀態、建立時間與報告入口。"
          action={
            <Link href="/products/new" className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
              建立商品企劃
            </Link>
          }
        />
      ) : (
        <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showImage={false}
              showCreatedAt
              showReviewCount
              showProgress
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-white p-5">
      <p className="text-sm text-graphite/70">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function mergeProducts(localProducts: Product[], cloudProducts: Product[]) {
  const byId = new Map<string, Product>();
  localProducts.forEach((product) => byId.set(product.id, product));
  cloudProducts.forEach((product) => byId.set(product.id, product));
  return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
