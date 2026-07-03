"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, WandSparkles } from "lucide-react";
import { AutosaveIndicator } from "@/components/autosave/AutosaveIndicator";
import { ResumeDraftBanner } from "@/components/autosave/ResumeDraftBanner";
import { SyncAnonymousDraftDialog } from "@/components/autosave/SyncAnonymousDraftDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, inputClassName } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MockImageUpload } from "@/components/product/MockImageUpload";
import { useAutosaveProductDraft } from "@/hooks/useAutosaveProductDraft";
import { generateMockLaunchReport, launchReportToSections } from "@/lib/ai/mock-generate-launch-report";
import type { GenerateReportApiResponse } from "@/lib/ai/provider";
import { createProductFromDraft, upsertDemoProduct } from "@/lib/storage/local-demo-store";
import { upsertStoredLaunchReport } from "@/lib/storage/local-report-store";
import { formatCurrency } from "@/lib/utils";
import type { LaunchReport, NewProductDraft, Product } from "@/types";
import { useRouter } from "@/i18n/navigation";

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
  const t = useTranslations("form");
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [generatedReport, setGeneratedReport] = useState<LaunchReport | null>(null);
  const [generationMessage, setGenerationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const autosave = useAutosaveProductDraft(draft);

  const generatedSections = useMemo(
    () => (generatedReport ? launchReportToSections(generatedReport) : []),
    [generatedReport]
  );

  function updateField(field: keyof NewProductDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleResumeDraft() {
    const stored = autosave.resumeDraft();
    if (stored) {
      setDraft(stored.formData);
      setResumeDismissed(true);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setGenerationMessage("");

    const localProduct = createProductFromDraft(draft);
    const cloudProduct = await createCloudProduct(draft);
    const product = cloudProduct ?? localProduct;
    upsertDemoProduct(product);

    const input = {
      productName: product.name,
      category: product.category,
      features: product.features,
      cost: product.cost,
      targetPrice: product.expectedPrice,
      targetAudience: product.targetAudience,
      brandStyle: product.brandStyle,
      salesChannels: product.salesPlatforms,
      imageUrl: product.imageUrl
    };

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...input,
          productId: cloudProduct ? product.id : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Generate report API failed with ${response.status}`);
      }

      const result = (await response.json()) as GenerateReportApiResponse;
      upsertStoredLaunchReport({
        productId: product.id,
        report: result.report,
        provider: result.provider,
        requestedProvider: result.requestedProvider,
        isFallback: result.isFallback,
        isAiGenerated: result.isAiGenerated,
        model: result.model,
        validationPassed: result.validationPassed,
        warning: result.warning,
        generatedAt: result.generatedAt
      });
      setGeneratedReport(result.report);
      setGenerationMessage(getGenerationStatusMessage(result));
      if (!result.savedReportId) {
        await saveCloudReport(product.id, result);
      }
      autosave.discardDraft();
      router.push(`/products/${product.id}/report`);
    } catch (error) {
      const fallbackReport = generateMockLaunchReport(input);
      const warning =
        error instanceof Error
          ? `API route 無法使用，已改用 MockAIProvider：${error.message}`
          : "API route 無法使用，已改用 MockAIProvider。";

      upsertStoredLaunchReport({
        productId: product.id,
        report: fallbackReport,
        provider: "mock",
        requestedProvider: "mock",
        isFallback: true,
        isAiGenerated: true,
        model: "paq-mock-v1",
        validationPassed: true,
        warning,
        generatedAt: new Date().toISOString()
      });
      setGeneratedReport(fallbackReport);
      setGenerationMessage(warning);
      await saveCloudReport(product.id, {
        report: fallbackReport,
        provider: "mock",
        isFallback: true,
        model: "paq-mock-v1",
        validationPassed: true,
        generatedAt: new Date().toISOString()
      });
      autosave.discardDraft();
      router.push(`/products/${product.id}/report`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-8">
      <PageHeader
        eyebrow={<StatusBadge status="demo" label={t("eyebrow")} />}
        title={t("title")}
        description={t("description")}
      />

      <ResumeDraftBanner
        draft={!resumeDismissed ? autosave.resumableDraft : null}
        onResume={handleResumeDraft}
        onDiscard={() => {
          setResumeDismissed(true);
          autosave.discardDraft();
        }}
      />

      <SyncAnonymousDraftDialog draft={autosave.localDraft} />

      <form onSubmit={handleSubmit} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" aria-busy={isSubmitting}>
        <section className="surface grid min-w-0 gap-5 p-5 sm:p-6" aria-labelledby="product-data-heading">
          <div>
            <h2 id="product-data-heading" className="text-lg font-semibold text-ink">{t("data")}</h2>
            <p className="mt-2 text-sm leading-6 text-graphite/72">{t("dataText")}</p>
            <div className="mt-3">
              <AutosaveIndicator status={autosave.status} autosavedAt={autosave.autosavedAt} message={autosave.message} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("name")} htmlFor="product-name">
              <input
                id="product-name"
                name="productName"
                className={inputClassName}
                placeholder={t("namePlaceholder")}
                value={draft.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </Field>
            <Field label={t("category")} htmlFor="product-category">
              <select
                id="product-category"
                name="category"
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

          <Field label={t("features")} htmlFor="product-features">
            <textarea
              id="product-features"
              name="features"
              className={`${inputClassName} min-h-28 py-3`}
              placeholder={t("featuresPlaceholder")}
              value={draft.features}
              onChange={(event) => updateField("features", event.target.value)}
              required
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("cost")} htmlFor="product-cost">
              <input
                id="product-cost"
                name="cost"
                className={inputClassName}
                inputMode="decimal"
                placeholder="72"
                value={draft.cost}
                onChange={(event) => updateField("cost", event.target.value)}
                required
              />
            </Field>
            <Field label={t("price")} htmlFor="product-price">
              <input
                id="product-price"
                name="expectedPrice"
                className={inputClassName}
                inputMode="decimal"
                placeholder="320"
                value={draft.expectedPrice}
                onChange={(event) => updateField("expectedPrice", event.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("audience")} htmlFor="target-audience">
              <textarea
                id="target-audience"
                name="targetAudience"
                className={`${inputClassName} min-h-24 py-3`}
                placeholder={t("audiencePlaceholder")}
                value={draft.targetAudience}
                onChange={(event) => updateField("targetAudience", event.target.value)}
                required
              />
            </Field>
            <Field label={t("style")} htmlFor="brand-style">
              <textarea
                id="brand-style"
                name="brandStyle"
                className={`${inputClassName} min-h-24 py-3`}
                placeholder={t("stylePlaceholder")}
                value={draft.brandStyle}
                onChange={(event) => updateField("brandStyle", event.target.value)}
                required
              />
            </Field>
          </div>

          <Field label={t("channels")} htmlFor="sales-channels" hint={t("channelsHint")}>
            <input
              id="sales-channels"
              name="salesChannels"
              className={inputClassName}
              placeholder={t("channelsPlaceholder")}
              value={draft.salesChannels}
              onChange={(event) => updateField("salesChannels", event.target.value)}
            />
          </Field>

          <div className="grid min-h-[5.5rem] gap-3 border-t border-line pt-5 sm:flex sm:items-start sm:justify-between sm:pe-36 xl:pe-0">
            <div className="min-h-6 min-w-0" aria-live="polite">
              {generationMessage ? (
                <p className="break-words rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                  {generationMessage}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="w-full shrink-0 sm:w-auto" disabled={isSubmitting}>
              <WandSparkles size={18} className="shrink-0" aria-hidden="true" />
              {isSubmitting ? t("loading") : t("submit")}
            </Button>
          </div>
        </section>

        <aside className="grid min-w-0 gap-4 self-start xl:sticky xl:top-24">
          <MockImageUpload />
          <div className="surface p-5">
            <h2 className="text-base font-semibold text-ink">{t("demoTitle")}</h2>
            <ul className="mt-3 grid gap-2 break-words text-sm leading-6 text-graphite/75">
              <li>{t("reminder1")}</li>
              <li>{t("reminder2")}</li>
              <li>{t("reminder3")}</li>
            </ul>
          </div>
        </aside>
      </form>

      {generatedReport ? (
        <section className="surface grid min-w-0 gap-5 p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge tone="teal">AI report 已產生</Badge>
              <h2 className="mt-3 break-words text-2xl font-semibold text-ink">{generatedReport.productTitle}</h2>
              <p className="mt-3 max-w-4xl break-words text-sm leading-6 text-graphite/75">
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

async function createCloudProduct(draft: NewProductDraft): Promise<Product | null> {
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft })
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { product?: Product };
    return data.product ?? null;
  } catch {
    return null;
  }
}

type CloudReportSaveInput = Pick<
  GenerateReportApiResponse,
  "report" | "provider" | "model" | "isFallback" | "validationPassed" | "generatedAt"
>;

function getGenerationStatusMessage(result: GenerateReportApiResponse) {
  if (result.warning) return result.warning;
  if (result.isFallback || result.provider === "mock") return "目前使用 Mock analysis / 示範分析。登入並設定 real AI provider 後可使用真實 AI 商品分析。";
  return `Real AI analysis generated via ${result.provider} (${result.model}).`;
}

async function saveCloudReport(productId: string, result: CloudReportSaveInput) {
  try {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        report: result.report,
        metadata: {
          provider: result.provider,
          model: result.model,
          isFallback: result.isFallback,
          validationPassed: result.validationPassed,
          generatedAt: result.generatedAt
        }
      })
    });
  } catch {
    // Cloud report persistence is best-effort in the demo; local report persistence remains the source of truth.
  }
}
