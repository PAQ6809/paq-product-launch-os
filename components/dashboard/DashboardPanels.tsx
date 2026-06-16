"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, PackagePlus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { loadDemoProducts } from "@/lib/storage/local-demo-store";
import { cn, formatDateTime, lifecycleLabels, lifecycleSteps } from "@/lib/utils";
import { sampleProducts } from "@/data/sample-products";
import type { Product } from "@/types";

function CompactLifecycle({ status }: { status: Product["lifecycleStatus"] }) {
  const activeIndex = Math.max(0, lifecycleSteps.indexOf(status));

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {lifecycleSteps.map((step, index) => {
          const isDone = index <= activeIndex;

          return (
            <span
              key={step}
              title={lifecycleLabels[step]}
              className={cn(
                "h-2 rounded-full",
                isDone ? "bg-teal-500" : "bg-line"
              )}
            />
          );
        })}
      </div>
      <p className="text-xs text-graphite/65">
        idea → research → positioning → packaging → listing → marketing → launched → optimizing
      </p>
    </div>
  );
}

export function DashboardPanels() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);

  useEffect(() => {
    setProducts(loadDemoProducts());
  }, []);

  const totalPending = useMemo(
    () => products.reduce((sum, product) => sum + product.pendingReviewCount, 0),
    [products]
  );

  const userCreatedCount = Math.max(0, products.length - sampleProducts.length);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-graphite/70">商品企劃</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{products.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-graphite/70">待審核 section</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{totalPending}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-graphite/70">本機新增商品</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{userCreatedCount}</p>
        </Card>
      </div>

      <section id="demo-products" className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">Product Lifecycle Dashboard</h1>
            <p className="mt-1 text-sm text-graphite/70">
              Demo 商品與你建立的商品會保存在 localStorage，重新整理後仍可展示。
            </p>
          </div>
          <Link
            href="/products/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-graphite"
          >
            <PackagePlus size={16} aria-hidden="true" />
            建立商品企劃
          </Link>
        </div>

        <div className="grid divide-y divide-line">
          {products.map((product) => (
            <article key={product.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.1fr_0.75fr_1fr_auto] lg:items-center">
              <div>
                <p className="font-semibold text-ink">{product.name}</p>
                <p className="mt-1 text-sm text-graphite/70">{product.category}</p>
              </div>
              <div>
                <Badge tone="teal">{lifecycleLabels[product.lifecycleStatus]}</Badge>
                <p className="mt-2 text-xs text-graphite/65">{formatDateTime(product.createdAt)}</p>
              </div>
              <CompactLifecycle status={product.lifecycleStatus} />
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Badge tone={product.pendingReviewCount > 5 ? "amber" : "neutral"}>
                  {product.pendingReviewCount} 待審核
                </Badge>
                <Link
                  href={`/products/${product.id}/report`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600"
                >
                  查看報告
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-teal-600" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-ink">Demo 狀態</h2>
            <p className="mt-2 text-sm leading-6 text-graphite/75">
              目前是 Mock AI Demo，不會呼叫外部 AI、不會寫入資料庫，也不會串 Shopify、蝦皮或 Pinkoi API。報告內容可複製、匯出，正式對外使用前仍需人工審核。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
