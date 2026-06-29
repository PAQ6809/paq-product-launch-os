"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, FileText, Package, PackageSearch, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LifecycleProgress } from "@/components/product/LifecycleProgress";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { findDemoProduct } from "@/lib/storage/local-demo-store";
import { formatCurrency, getMarginRate } from "@/lib/utils";
import type { Product } from "@/types";
import { Link } from "@/i18n/navigation";

type ProductDetailProps = {
  product: Product;
  requestedProductId?: string;
};

export function ProductDetail({ product, requestedProductId }: ProductDetailProps) {
  const t = useTranslations("product");
  const lifecycle = useTranslations("lifecycle");
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
      void fetchCloudProduct(targetId).then((cloudProduct) => {
        if (!cloudProduct) {
          setLookupState("missing");
          return;
        }

        setActiveProduct(cloudProduct);
        setLookupState("ready");
      });
      return;
    }

    setActiveProduct(product);
    setLookupState("ready");
  }, [product, requestedProductId]);

  if (lookupState === "pending") {
    return (
      <section className="surface min-h-[26rem] overflow-hidden p-5 sm:p-6" aria-busy="true" aria-label="正在讀取本機商品資料">
        <div className="motion-safe:animate-pulse">
          <div className="h-7 w-28 rounded-md bg-teal-50" />
          <div className="mt-5 h-9 w-3/4 max-w-xl rounded-md bg-line/70" />
          <div className="mt-3 h-5 w-full max-w-2xl rounded-md bg-line/50" />
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="aspect-[4/3] rounded-md bg-mist" />
            <div className="min-h-64 rounded-md bg-mist" />
          </div>
        </div>
      </section>
    );
  }

  if (lookupState === "missing") {
    return (
      <EmptyState
        icon={PackageSearch}
        title={t("missing")}
        description={t("missingText")}
        action={
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
            {t("backDashboard")}
          </Link>
        }
      />
    );
  }

  const reportLink = (
    <Link
      href={`/products/${activeProduct.id}/report`}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:w-auto"
    >
      {t("viewReport")}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );

  return (
    <div className="grid min-w-0 gap-8">
      <PageHeader
        eyebrow={<Badge tone="teal">{lifecycle(activeProduct.lifecycleStatus)}</Badge>}
        title={activeProduct.name}
        description={activeProduct.features}
        actions={reportLink}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden">
          <div className="relative aspect-[4/3] w-full bg-mist">
            <Image
              src={activeProduct.imageUrl}
              alt={`${activeProduct.name} 商品圖片`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover"
            />
          </div>
        </Card>

        <section className="surface min-w-0 p-5 sm:p-6" aria-labelledby="product-overview-heading">
          <h2 id="product-overview-heading" className="text-lg font-semibold text-ink">{t("overview")}</h2>

          <div className="mt-5 grid items-stretch gap-3 md:grid-cols-3">
            <div className="min-w-0 rounded-md border border-line bg-mist p-4">
              <Package className="mb-3 h-5 w-5 text-teal-600" aria-hidden="true" />
              <p className="text-xs text-graphite/65">{t("category")}</p>
              <p className="mt-1 break-words font-semibold text-ink">{activeProduct.category}</p>
            </div>
            <div className="min-w-0 rounded-md border border-line bg-mist p-4">
              <Users className="mb-3 h-5 w-5 text-teal-600" aria-hidden="true" />
              <p className="text-xs text-graphite/65">{t("audience")}</p>
              <p className="mt-1 break-words text-sm font-semibold leading-5 text-ink">{activeProduct.targetAudience}</p>
            </div>
            <div className="min-w-0 rounded-md border border-line bg-mist p-4">
              <FileText className="mb-3 h-5 w-5 text-teal-600" aria-hidden="true" />
              <p className="text-xs text-graphite/65">{t("latestReport")}</p>
              <p className="mt-1 break-words text-sm font-semibold leading-5 text-ink">{activeProduct.latestReportTitle}</p>
            </div>
          </div>

          <dl className="mt-6 grid min-w-0 gap-4 border-t border-line pt-6 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-sm text-graphite/65">{t("cost")}</dt>
              <dd className="mt-1 break-words font-semibold text-ink">{formatCurrency(activeProduct.cost)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm text-graphite/65">{t("price")}</dt>
              <dd className="mt-1 break-words font-semibold text-ink">
                {formatCurrency(activeProduct.expectedPrice)} / {t("margin")} {getMarginRate(activeProduct.cost, activeProduct.expectedPrice)}%
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm text-graphite/65">{t("brandStyle")}</dt>
              <dd className="mt-1 break-words font-semibold text-ink">{activeProduct.brandStyle}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm text-graphite/65">{t("channels")}</dt>
              <dd className="mt-1 break-words font-semibold text-ink">{activeProduct.salesPlatforms.join(", ") || t("notSet")}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="surface min-w-0 p-5 sm:p-6">
        <LifecycleProgress status={activeProduct.lifecycleStatus} />
      </section>
    </div>
  );
}

async function fetchCloudProduct(productId: string) {
  try {
    const response = await fetch(`/api/products/${productId}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { product?: Product };
    return data.product ?? null;
  } catch {
    return null;
  }
}
