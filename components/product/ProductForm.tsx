"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, inputClassName } from "@/components/ui/Field";
import { MockImageUpload } from "@/components/product/MockImageUpload";
import { generateMockLaunchReport, launchReportToSections } from "@/lib/ai/mock-generate-launch-report";
import { createProductFromDraft, upsertDemoProduct } from "@/lib/storage/local-demo-store";
import { formatCurrency } from "@/lib/utils";
import type { LaunchReport, NewProductDraft } from "@/types";

const initialDraft: NewProductDraft = {
  name: "",
  category: "文創小物",
  features: "",
  cost: "",
  expectedPrice: "",
  targetAudience: "",
  brandStyle: "乾淨、可信任、有質感",
  salesChannels: "Pinkoi, IG"
};

export function ProductForm() {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [generatedReport, setGeneratedReport] = useState<LaunchReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatedSections = useMemo(
    () => (generatedReport ? launchReportToSections(generatedReport) : []),
    [generatedReport]
  );

  function updateField(field: keyof NewProductDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const product = createProductFromDraft(draft);
    upsertDemoProduct(product);

    const report = generateMockLaunchReport({
      productName: product.name,
      category: product.category,
      features: product.features,
      cost: product.cost,
      targetPrice: product.expectedPrice,
      targetAudience: product.targetAudience,
      brandStyle: product.brandStyle,
      salesChannels: product.salesPlatforms,
      imageUrl: product.imageUrl
    });

    setGeneratedReport(report);
    router.push(`/products/${product.id}/report`);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="surface grid gap-5 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
              Product Input
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              建立商品上市企劃
            </h1>
            <p className="mt-3 text-sm leading-6 text-graphite/72">
              填入商品資料後，系統會用 Mock AI workflow 產生上市企劃書，並將商品保存在 localStorage。v0.2 尚未接正式 AI 與資料庫。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="商品名稱">
              <input
                className={inputClassName}
                placeholder="例如：島嶼紙感書籤組"
                value={draft.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </Field>
            <Field label="商品類別">
              <select
                className={inputClassName}
                value={draft.category}
                onChange={(event) => updateField("category", event.target.value)}
              >
                <option>文創小物</option>
                <option>3C 配件</option>
                <option>生活香氛</option>
                <option>服飾配件</option>
                <option>美妝保養</option>
                <option>其他商品</option>
              </select>
            </Field>
          </div>

          <Field label="商品功能與特色">
            <textarea
              className={`${inputClassName} min-h-28 py-3`}
              placeholder="例如：厚磅紙材、局部燙金、適合送禮與日常閱讀收藏"
              value={draft.features}
              onChange={(event) => updateField("features", event.target.value)}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="商品成本">
              <input
                className={inputClassName}
                inputMode="decimal"
                placeholder="72"
                value={draft.cost}
                onChange={(event) => updateField("cost", event.target.value)}
                required
              />
            </Field>
            <Field label="預計售價">
              <input
                className={inputClassName}
                inputMode="decimal"
                placeholder="320"
                value={draft.expectedPrice}
                onChange={(event) => updateField("expectedPrice", event.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="目標客群">
              <textarea
                className={`${inputClassName} min-h-24 py-3`}
                placeholder="例如：喜歡閱讀、手帳、台灣設計與小型禮物的 20-35 歲族群"
                value={draft.targetAudience}
                onChange={(event) => updateField("targetAudience", event.target.value)}
                required
              />
            </Field>
            <Field label="品牌風格">
              <textarea
                className={`${inputClassName} min-h-24 py-3`}
                placeholder="例如：溫暖、細膩、有台灣文化感"
                value={draft.brandStyle}
                onChange={(event) => updateField("brandStyle", event.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="銷售平台" hint="可用逗號、頓號或換行分隔，例如 Pinkoi, IG, 蝦皮">
            <input
              className={inputClassName}
              placeholder="Pinkoi, IG"
              value={draft.salesChannels}
              onChange={(event) => updateField("salesChannels", event.target.value)}
            />
          </Field>

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
            <WandSparkles size={18} aria-hidden="true" />
            儲存並產生 Mock AI 報告
          </Button>
        </div>

        <aside className="grid gap-4 self-start">
          <MockImageUpload />
          <div className="surface p-5">
            <h2 className="text-base font-semibold text-ink">Demo 提醒</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-graphite/75">
              <li>目前不會呼叫正式 AI API。</li>
              <li>商品與報告資料會先存在瀏覽器 localStorage。</li>
              <li>食品、美妝、保健、醫療類內容仍需人工與法規審核。</li>
            </ul>
          </div>
        </aside>
      </form>

      {generatedReport ? (
        <section className="surface grid gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge tone="teal">Mock AI workflow 已產生</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{generatedReport.productTitle}</h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-graphite/75">
                {generatedReport.shortDescription}
              </p>
            </div>
            <div className="rounded-md border border-line bg-white p-4 text-sm text-graphite/80">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <FileText size={16} aria-hidden="true" />
                報告摘要
              </div>
              <p className="mt-2">section：{generatedSections.length}</p>
              <p>建議售價：{formatCurrency(generatedReport.pricingStrategy.suggestedPrice)}</p>
              <p>預估毛利率：{generatedReport.pricingStrategy.marginRate}%</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
