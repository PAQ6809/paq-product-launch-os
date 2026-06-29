import Image from "next/image";
import { ArrowUpRight, CalendarDays, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { LifecycleProgress } from "@/components/product/LifecycleProgress";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Product } from "@/types";
import { Link } from "@/i18n/navigation";

type ProductCardProps = {
  product: Product;
  href?: string;
  actionLabel?: string;
  showImage?: boolean;
  showCreatedAt?: boolean;
  showReviewCount?: boolean;
  showProgress?: boolean;
};

export function ProductCard({
  product,
  href = `/products/${product.id}/report`,
  actionLabel,
  showImage = true,
  showCreatedAt = false,
  showReviewCount = false,
  showProgress = false
}: ProductCardProps) {
  const t = useTranslations("product");
  const lifecycle = useTranslations("lifecycle");
  const resolvedActionLabel = actionLabel ?? t("viewReport");
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-panel">
      {showImage ? (
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden border-b border-line bg-mist">
          <Image
            src={product.imageUrl}
            alt={`${product.name} 商品預覽`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge tone="teal">{product.category}</Badge>
          <Badge>{lifecycle(product.lifecycleStatus)}</Badge>
        </div>
        <h3 className="mt-3 break-words text-lg font-semibold leading-7 text-ink">{product.name}</h3>
        <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-graphite/75">{product.features}</p>

        <div className="mt-4 grid min-w-0 gap-2 text-sm text-graphite/75">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={15} className="shrink-0" aria-hidden="true" />
            <span className="break-words">{formatCurrency(product.expectedPrice)} {t("suggestedPrice")}</span>
          </div>
          {showCreatedAt ? (
            <div className="flex min-w-0 items-center gap-2">
              <CalendarDays size={15} className="shrink-0" aria-hidden="true" />
              <span className="break-words">{formatDateTime(product.createdAt)}</span>
            </div>
          ) : null}
          {showReviewCount ? <Badge tone={product.pendingReviewCount > 5 ? "amber" : "neutral"}>{product.pendingReviewCount} {t("pending")}</Badge> : null}
        </div>

        {showProgress ? <LifecycleProgress status={product.lifecycleStatus} compact className="mt-4" /> : null}

        <Link
          href={href}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          <span className="break-words">{resolvedActionLabel}</span>
          <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
