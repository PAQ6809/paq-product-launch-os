"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LifecycleProgress } from "@/components/product/LifecycleProgress";
import { findDemoProduct } from "@/lib/storage/local-demo-store";
import { formatCurrency, getMarginRate, lifecycleLabels } from "@/lib/utils";
import type { Product } from "@/types";

type ProductDetailProps = {
  product: Product;
  requestedProductId?: string;
};

export function ProductDetail({ product, requestedProductId }: ProductDetailProps) {
  const [activeProduct, setActiveProduct] = useState(product);
  const expectsLocalProduct = Boolean(requestedProductId && requestedProductId !== product.id);
  const [lookupState, setLookupState] = useState<"pending" | "ready" | "missing">(
    expectsLocalProduct ? "pending" : "ready"
  );

  useEffect(() => {
    const targetId = requestedProductId ?? product.id;
    const storedProduct = findDemoProduct(targetId);

    if (storedProduct) {
      setActiveProduct(storedProduct);
      setLookupState("ready");
      return;
    }

    if (targetId !== product.id) {
      setLookupState("missing");
      return;
    }

    setActiveProduct(product);
    setLookupState("ready");
  }, [product, requestedProductId]);

  if (lookupState === "pending") {
    return (
      <section className="surface p-6">
        <Badge tone="amber">Local demo data</Badge>
        <h1 className="mt-4 text-2xl font-semibold text-ink">正在讀取本機商品資料...</h1>
        <p className="mt-3 text-sm leading-6 text-graphite/75">
          這個商品是從 localStorage 讀取，稍候會顯示完整詳情。
        </p>
      </section>
    );
  }

  if (lookupState === "missing") {
    return (
      <section className="surface p-6">
        <Badge tone="coral">找不到商品</Badge>
        <h1 className="mt-4 text-2xl font-semibold text-ink">本機沒有這筆商品資料</h1>
        <p className="mt-3 text-sm leading-6 text-graphite/75">
          這可能是 localStorage 被清除，或你開啟了另一個瀏覽器環境。請回 Dashboard 查看目前可用商品。
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-graphite"
        >
          回 Dashboard
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3]">
            <Image
              src={activeProduct.imageUrl}
              alt={`${activeProduct.name} 商品圖片`}
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover"
            />
          </div>
        </Card>

        <section className="surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="teal">{lifecycleLabels[activeProduct.lifecycleStatus]}</Badge>
              <h1 className="mt-4 text-3xl font-semibold text-ink">{activeProduct.name}</h1>
              <p className="mt-3 text-base leading-7 text-graphite/75">{activeProduct.features}</p>
            </div>
            <Link
              href={`/products/${activeProduct.id}/report`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-graphite"
            >
              查看報告
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-mist p-4">
              <Package className="mb-3 h-5 w-5 text-teal-600" aria-hidden="true" />
              <p className="text-xs text-graphite/65">商品類別</p>
              <p className="mt-1 font-semibold text-ink">{activeProduct.category}</p>
            </div>
            <div className="rounded-md border border-line bg-mist p-4">
              <Users className="mb-3 h-5 w-5 text-teal-600" aria-hidden="true" />
              <p className="text-xs text-graphite/65">目標客群</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-ink">
                {activeProduct.targetAudience}
              </p>
            </div>
            <div className="rounded-md border border-line bg-mist p-4">
              <FileText className="mb-3 h-5 w-5 text-teal-600" aria-hidden="true" />
              <p className="text-xs text-graphite/65">最近報告</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-ink">
                {activeProduct.latestReportTitle}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-graphite/65">商品成本</dt>
              <dd className="mt-1 font-semibold text-ink">{formatCurrency(activeProduct.cost)}</dd>
            </div>
            <div>
              <dt className="text-sm text-graphite/65">預計售價</dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatCurrency(activeProduct.expectedPrice)} / 毛利率{" "}
                {getMarginRate(activeProduct.cost, activeProduct.expectedPrice)}%
              </dd>
            </div>
            <div>
              <dt className="text-sm text-graphite/65">品牌風格</dt>
              <dd className="mt-1 font-semibold text-ink">{activeProduct.brandStyle}</dd>
            </div>
            <div>
              <dt className="text-sm text-graphite/65">銷售平台</dt>
              <dd className="mt-1 font-semibold text-ink">{activeProduct.salesPlatforms.join("、")}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="surface p-5 sm:p-6">
        <LifecycleProgress status={activeProduct.lifecycleStatus} />
      </section>
    </div>
  );
}
