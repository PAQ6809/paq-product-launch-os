"use client";

import { useEffect, useMemo, useState } from "react";
import { History, PackagePlus, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { sampleProducts } from "@/data/sample-products";
import { loadDemoProducts, upsertDemoProduct } from "@/lib/storage/local-demo-store";
import type { Product } from "@/types";
import { Link } from "@/i18n/navigation";

export function DashboardPanels() {
  const t = useTranslations("dashboard");
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

      const merged = mergeProducts(loadDemoProducts(), data.products);
      data.products.forEach((product) => upsertDemoProduct(product));
      setProducts(merged);
      setWorkspaceMode("cloud");
    } catch {
      setWorkspaceMode("local");
    }
  }

  const totalPending = useMemo(
    () => products.reduce((sum, product) => sum + product.pendingReviewCount, 0),
    [products]
  );
  const userCreatedCount = Math.max(0, products.length - sampleProducts.length);
  const metrics = [
    { label: t("plans"), value: products.length },
    { label: t("pending"), value: totalPending },
    { label: t("local"), value: userCreatedCount }
  ];

  return (
    <div className="grid min-w-0 gap-8">
      <PageHeader
        eyebrow={<Badge tone="teal">{t("eyebrow")}</Badge>}
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/products/new"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:w-auto"
          >
            <PackagePlus size={16} aria-hidden="true" />
            {t("create")}
          </Link>
          <Link
            href="/products"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal-200 hover:bg-teal-50 sm:w-auto"
          >
            <History size={16} aria-hidden="true" />
            商品歷史
          </Link>
          </div>
        }
      />

      <section className="rounded-md border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={workspaceMode === "cloud" ? "teal" : "amber"}>
            {workspaceMode === "cloud" ? "Cloud workspace" : "Local demo workspace"}
          </Badge>
          <p className="text-sm leading-6 text-graphite/72">
            {workspaceMode === "cloud"
              ? "已讀取登入帳號的 Supabase 商品資料，並保留 Demo 商品作為展示。"
              : "未登入或尚未設定 Supabase 時，會使用 Demo 與這台裝置的 localStorage。"}
          </p>
        </div>
      </section>

      <section aria-label="Dashboard 摘要" className="grid items-stretch gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="h-full p-5">
            <p className="break-words text-sm text-graphite/70">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{metric.value}</p>
          </Card>
        ))}
      </section>

      <section id="demo-products" aria-label="商品企劃列表">
        <SectionHeader
          className="mb-5"
          eyebrow={t("list")}
          title={t("listTitle")}
          description={t("listText")}
        />

        {products.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyText")}
            action={
              <Link href="/products/new" className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
                {t("create")}
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
      </section>

      <section className="rounded-md border border-teal-100 bg-teal-50 p-5 sm:p-6" aria-labelledby="demo-state-heading">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="demo-state-heading" className="font-semibold text-ink">{t("demoTitle")}</h2>
            <p className="mt-2 break-words text-sm leading-6 text-teal-800">
              {t("demoText")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function mergeProducts(localProducts: Product[], cloudProducts: Product[]) {
  const byId = new Map<string, Product>();
  localProducts.forEach((product) => byId.set(product.id, product));
  cloudProducts.forEach((product) => byId.set(product.id, product));
  return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
