import Link from "next/link";
import { ArrowUpRight, FileText, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { sampleProducts } from "@/data/sample-products";
import { formatCurrency, lifecycleLabels } from "@/lib/utils";

export function DemoPreview() {
  return (
    <section id="demo-products" className="bg-white py-14 sm:py-20">
      <div className="page-shell">
        <div className="mb-8 flex flex-col gap-3 sm:max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
            Demo 商品
          </p>
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            直接查看三個 Demo 商品的完整上市企劃
          </h2>
          <p className="text-sm leading-6 text-graphite/75">
            不需要重新填表。這三個範例分別代表文創小物、3C 配件與生活香氛，方便快速展示不同商品類型的企劃結果。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {sampleProducts.map((product) => (
            <Card
              key={product.id}
              className="grid gap-5 p-5 transition duration-200 hover:-translate-y-1 hover:border-teal-100 hover:shadow-panel"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="teal">{product.category}</Badge>
                  <h3 className="mt-3 text-xl font-semibold text-ink">{product.name}</h3>
                </div>
                <Sparkles className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-graphite/75">{product.features}</p>
              <div className="grid gap-2 text-sm text-graphite/75">
                <div className="flex items-center gap-2">
                  <Package size={15} aria-hidden="true" />
                  {lifecycleLabels[product.lifecycleStatus]}
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={15} aria-hidden="true" />
                  {formatCurrency(product.expectedPrice)} 建議售價
                </div>
              </div>
              <Link
                href={`/products/${product.id}/report`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                查看完整上市企劃
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
