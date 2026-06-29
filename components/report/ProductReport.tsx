"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, History, Languages, Loader2, PackageSearch, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TranslationStatusBadge } from "@/components/i18n/TranslationStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LifecycleProgress } from "@/components/product/LifecycleProgress";
import { EditableReportSection } from "@/components/report/EditableReportSection";
import { ExportButtonGroup } from "@/components/report/ExportButtonGroup";
import { ReportSectionCard } from "@/components/report/ReportSectionCard";
import { ReportToc } from "@/components/report/ReportToc";
import { ExportDialog } from "@/components/reports/ExportDialog";
import { generateMockLaunchReport, launchReportToSections } from "@/lib/ai/mock-generate-launch-report";
import { findDemoProduct, upsertDemoProduct } from "@/lib/storage/local-demo-store";
import { findStoredLaunchReport, upsertStoredLaunchReport, type StoredLaunchReport } from "@/lib/storage/local-report-store";
import { findStoredTranslation, upsertStoredTranslation } from "@/lib/storage/local-translation-store";
import { readCachedTranslation, writeCachedTranslation } from "@/lib/translation/cache";
import {
  buildTranslationSourceSections,
  translationSectionMetas
} from "@/lib/translation/translation-sections";
import type { TranslateReportApiResponse } from "@/lib/translation/provider";
import { isRtlLocale, localeCatalog, supportedLocales, type AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import type {
  LaunchReport,
  Product,
  ReportAuditLogEntry,
  ReportReviewStatus,
  ReportSection,
  ReviewedReportSection,
  ReviewAction,
  TranslationResult,
  TranslationLocale,
  TranslationSectionKey
} from "@/types";

const demoActorName = "Demo Reviewer";

const actionLabels: Record<ReviewAction, string> = {
  edit: "編輯",
  approve: "核准",
  reject: "退回"
};

type ProductReportProps = {
  product: Product;
  requestedProductId?: string;
};

type ReportViewMode = "original" | "translated" | "bilingual";

function createLogId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function productToReport(product: Product): LaunchReport {
  return generateMockLaunchReport({
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
}

function getPositioningOneLiner(positioning: string) {
  const firstSentence = positioning.split("。")[0]?.trim();
  const source = firstSentence || positioning.trim();

  if (source.length <= 86) {
    return source;
  }

  return `${source.slice(0, 86)}...`;
}

function toReviewedSections(sections: ReportSection[]): ReviewedReportSection[] {
  return sections.map((section) => ({
    ...section,
    reviewStatus: "draft",
    humanEdited: false,
    originalContent: section.content
  }));
}

function translationSectionId(key: TranslationSectionKey) {
  return `translation-${key}`;
}

function translationToReviewedSections(translation: TranslationResult): ReviewedReportSection[] {
  return translationSectionMetas.map((meta) => ({
    id: translationSectionId(meta.key),
    title: meta.enTitle,
    content: translation.sections[meta.key],
    originalContent: translation.sections[meta.key],
    riskLevel: meta.key === "legalRiskNotes" ? "high" : "medium",
    reviewStatus: "draft",
    humanEdited: false
  }));
}

function translationKeyFromSectionId(sectionId: string): TranslationSectionKey | null {
  const rawKey = sectionId.replace(/^translation-/, "");
  const match = translationSectionMetas.find((meta) => meta.key === rawKey);

  return match?.key ?? null;
}

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function createAuditLogEntry({
  section,
  action,
  previousContent,
  newContent,
  nextStatus
}: {
  section: ReviewedReportSection;
  action: ReviewAction;
  previousContent: string;
  newContent: string;
  nextStatus: ReportReviewStatus;
}): ReportAuditLogEntry {
  return {
    id: createLogId(),
    actorName: demoActorName,
    sectionId: section.id,
    sectionTitle: section.title,
    action,
    createdAt: new Date().toISOString(),
    originalAIContent: section.originalContent,
    previousContent,
    newContent,
    nextStatus
  };
}

function splitEditedList(content: string) {
  return content
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[\).、])\s*/, "").trim())
    .filter(Boolean);
}

function sectionEditMap(sections: ReviewedReportSection[]) {
  return new Map(sections.filter((section) => section.humanEdited).map((section) => [section.id, section.content]));
}

function buildExportReport(report: LaunchReport, sections: ReviewedReportSection[]): LaunchReport {
  const edits = sectionEditMap(sections);
  const next: LaunchReport = {
    ...report,
    keySellingPoints: [...report.keySellingPoints],
    competitorAnalysis: report.competitorAnalysis.map((item) => ({ ...item })),
    pricingStrategy: { ...report.pricingStrategy },
    packagingBrief: {
      ...report.packagingBrief,
      requiredElements: [...report.packagingBrief.requiredElements],
      complianceNotes: [...report.packagingBrief.complianceNotes]
    },
    seoKeywords: [...report.seoKeywords],
    socialPosts: report.socialPosts.map((item) => ({
      ...item,
      hashtags: [...item.hashtags]
    })),
    videoScripts: report.videoScripts.map((item) => ({
      ...item,
      scenes: [...item.scenes]
    })),
    faqs: report.faqs.map((item) => ({ ...item })),
    customerServiceScripts: report.customerServiceScripts.map((item) => ({ ...item })),
    launchChecklist: report.launchChecklist.map((item) => ({ ...item })),
    firstMonthMarketingPlan: report.firstMonthMarketingPlan.map((item) => ({
      ...item,
      actions: [...item.actions]
    })),
    optimizationSuggestions: report.optimizationSuggestions.map((item) => ({ ...item })),
    legalRiskNotes: [...report.legalRiskNotes]
  };

  next.positioning = edits.get("positioning") ?? next.positioning;
  next.targetAudienceAnalysis = edits.get("target-audience") ?? next.targetAudienceAnalysis;
  next.frontPackagingCopy = edits.get("front-packaging-copy") ?? next.frontPackagingCopy;
  next.backPackagingCopy = edits.get("back-packaging-copy") ?? next.backPackagingCopy;
  next.productTitle = edits.get("product-title") ?? next.productTitle;
  next.shortDescription = edits.get("short-description") ?? next.shortDescription;
  next.longDescription = edits.get("long-description") ?? next.longDescription;

  const listingCopy = edits.get("listing-copy");
  if (listingCopy) {
    next.longDescription = listingCopy;
  }

  const keySellingPoints = edits.get("key-selling-points");
  if (keySellingPoints) {
    next.keySellingPoints = splitEditedList(keySellingPoints);
  }

  const seoKeywords = edits.get("seo-keywords");
  if (seoKeywords) {
    next.seoKeywords = seoKeywords
      .split(/[,，、\n]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  const competitorAnalysis = edits.get("competitor-analysis");
  if (competitorAnalysis) {
    next.competitorAnalysis = [
      {
        name: "人工修改版競品分析",
        positioning: competitorAnalysis,
        priceRange: "請依實際市場補齊",
        strength: "人工修改內容",
        gap: "正式上架前請再次確認競品資料"
      }
    ];
  }

  const pricingStrategy = edits.get("pricing-strategy");
  if (pricingStrategy) {
    next.pricingStrategy = {
      ...next.pricingStrategy,
      rationale: pricingStrategy,
      promoNotes: `${next.pricingStrategy.promoNotes}\n\n人工審核提醒：定價修改後，請重新檢查成本、毛利、通路抽成與促銷空間。`
    };
  }

  const packagingBrief = edits.get("packaging-brief");
  if (packagingBrief) {
    next.packagingBrief = {
      ...next.packagingBrief,
      concept: packagingBrief,
      complianceNotes: [
        ...next.packagingBrief.complianceNotes,
        "此 brief 已經人工修改，正式印刷前請再次確認法規、商標、圖像授權與平台規則。"
      ]
    };
  }

  const socialPosts = edits.get("social-posts");
  if (socialPosts) {
    next.socialPosts = [
      {
        platform: "IG",
        caption: socialPosts,
        hashtags: next.seoKeywords.slice(0, 5).map((keyword) => `#${keyword.replace(/\s+/g, "")}`),
        cta: "請依實際活動補上 CTA"
      }
    ];
  }

  const videoScripts = edits.get("video-scripts");
  if (videoScripts) {
    next.videoScripts = [
      {
        title: "人工修改版短影音腳本",
        durationSeconds: 30,
        hook: "請依實際素材補上影片開頭 hook",
        scenes: splitEditedList(videoScripts),
        cta: "請依實際活動補上 CTA"
      }
    ];
  }

  const faqs = edits.get("faqs");
  if (faqs) {
    next.faqs = [
      {
        question: "人工修改版 FAQ",
        answer: faqs
      }
    ];
  }

  const customerServiceScripts = edits.get("customer-service-scripts");
  if (customerServiceScripts) {
    next.customerServiceScripts = [
      {
        scenario: "人工修改版客服情境",
        response: customerServiceScripts
      }
    ];
  }

  const launchChecklist = edits.get("launch-checklist");
  if (launchChecklist) {
    next.launchChecklist = splitEditedList(launchChecklist).map((task, index) => ({
      phase: `人工檢查 ${index + 1}`,
      task,
      ownerHint: "請指定負責人"
    }));
  }

  const firstMonthMarketingPlan = edits.get("first-month-marketing-plan");
  if (firstMonthMarketingPlan) {
    next.firstMonthMarketingPlan = [
      {
        week: "人工修改版首月計畫",
        focus: "請依實際上市節奏確認",
        actions: splitEditedList(firstMonthMarketingPlan),
        metric: "請補上實際觀察指標"
      }
    ];
  }

  const optimizationSuggestions = edits.get("optimization-suggestions");
  if (optimizationSuggestions) {
    next.optimizationSuggestions = splitEditedList(optimizationSuggestions).map((action, index) => ({
      signal: `人工優化訊號 ${index + 1}`,
      action,
      why: "人工修改內容，請依實際銷售資料驗證"
    }));
  }

  const legalRiskNotes = edits.get("legal-risk-notes");
  if (legalRiskNotes) {
    next.legalRiskNotes = splitEditedList(legalRiskNotes);
  }

  return next;
}

function ReportSummary({ product, report }: { product: Product; report: LaunchReport }) {
  const t = useTranslations("report");
  const productT = useTranslations("product");
  const lifecycle = useTranslations("lifecycle");
  const summaryItems = [
    { label: productT("overview"), value: product.name },
    { label: productT("category"), value: product.category },
    { label: productT("suggestedPrice"), value: formatCurrency(report.pricingStrategy.suggestedPrice) },
    { label: productT("audience"), value: product.targetAudience },
    { label: t("channels"), value: product.salesPlatforms.join(", ") || productT("notSet") },
    { label: lifecycle("title"), value: lifecycle(product.lifecycleStatus) }
  ];

  return (
    <section className="surface min-w-0 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone="teal">{t("summary")}</Badge>
          <h2 className="mt-3 break-words text-2xl font-semibold text-ink">{t("summaryTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/75">
            {t("summaryText")}
          </p>
        </div>
        <Badge tone="amber">{lifecycle(product.lifecycleStatus)}</Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-semibold text-graphite/55">{item.label}</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-teal-100 bg-teal-50 p-4">
        <p className="text-xs font-semibold text-teal-700">{t("corePosition")}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-ink">
          {getPositioningOneLiner(report.positioning)}
        </p>
      </div>
    </section>
  );
}

function LegalRiskPanel() {
  const t = useTranslations("report");
  const items = [t("legal1"), t("legal2"), t("legal3"), t("legal4")];

  return (
    <section className="surface border-l-4 border-l-amber-500 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-ink">{t("legal")}</h2>
          <p className="mt-1 text-sm text-graphite/65">{t("legalIntro")}</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-graphite/80">
            {items.map((item) => (
              <li key={item} className="flex min-w-0 gap-2">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                <span className="break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function EnglishReportSections({
  translation,
  translationSections,
  onSave,
  onStatusChange
}: {
  translation: TranslationResult;
  translationSections: ReviewedReportSection[];
  onSave: (sectionId: string, newContent: string) => void;
  onStatusChange: (sectionId: string, status: Extract<ReportReviewStatus, "approved" | "rejected">) => void;
}) {
  return (
    <div className="grid gap-4">
      <section className="rounded-md border border-teal-100 bg-teal-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={translation.provider !== "mock" ? "teal" : "amber"}>
            {translation.provider !== "mock" ? "AI Translated" : "Mock Translation"}
          </Badge>
          <Badge tone="teal">{localeCatalog[translation.targetLocale].name} Review</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-teal-700">
          Translated sections use the same human review controls: Copy, Edit, Approve, and Reject.
        </p>
      </section>

      {translationSections.map((section) => (
        <EditableReportSection
          key={section.id}
          section={section}
          onSave={onSave}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}

function BilingualReportSections({
  sourceReport,
  sourceSections,
  translation
}: {
  sourceReport: LaunchReport;
  sourceSections: ReviewedReportSection[];
  translation: TranslationResult;
}) {
  const sourceById = useMemo(() => new Map(sourceSections.map((section) => [section.id, section.content])), [sourceSections]);
  const sourceByKey = useMemo(() => buildTranslationSourceSections(sourceReport), [sourceReport]);

  return (
    <div className="grid gap-4">
      {translationSectionMetas.map((meta) => (
        <ReportSectionCard
          key={meta.key}
          id={`bi-${meta.key}`}
          title={`${meta.zhTitle} / ${meta.enTitle}`}
          badges={
            <>
              <StatusBadge status={translation.provider !== "mock" ? "ai-generated" : "mock"} label={translation.provider !== "mock" ? "AI Translated" : "Mock Translation"} />
              <Badge tone="amber">Bilingual Review</Badge>
            </>
          }
          copyText={`${meta.enTitle}\n\n${translation.sections[meta.key]}`}
          copyLabel="Copy translation"
        >
          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <div dir="ltr" className="min-w-0 rounded-md border border-line bg-white p-4 text-left">
              <p className="text-xs font-semibold text-graphite/55">
                中文原文
              </p>
              <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-graphite/82">
                {sourceById.get(meta.sourceSectionId) ?? sourceByKey[meta.key]}
              </div>
            </div>
            <div dir={isRtlLocale(translation.targetLocale) ? "rtl" : "ltr"} className="min-w-0 rounded-md border border-teal-100 bg-teal-50 p-4">
              <p className="text-xs font-semibold text-teal-700">
                {localeCatalog[translation.targetLocale].name} Translation
              </p>
              <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-graphite/82">
                {translation.sections[meta.key]}
              </div>
            </div>
          </div>
        </ReportSectionCard>
      ))}
    </div>
  );
}

function AuditLogPanel({ entries }: { entries: ReportAuditLogEntry[] }) {
  return (
    <section className="surface min-w-0 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-teal-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-ink">Audit log mock</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-graphite/72">
        第一版先存在前端 state，記錄誰修改、修改哪個 section、修改時間、原始 AI 內容與修改後內容。未來可對應資料表 audit_logs。
      </p>

      {entries.length === 0 ? (
        <EmptyState
          className="mt-4 min-h-44 border-0 bg-mist shadow-none"
          icon={History}
          title="尚未有審核紀錄"
          description="編輯、核准或退回任何 section 後，這裡會顯示前端 mock audit log。"
        />
      ) : (
        <div className="mt-4 grid gap-3">
          {entries.map((entry) => (
            <details key={entry.id} className="rounded-md border border-line bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {formatAuditTime(entry.createdAt)} / {entry.actorName} / {actionLabels[entry.action]} /{" "}
                {entry.sectionTitle}
              </summary>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-graphite/55">
                    原始 AI 內容
                  </p>
                  <div className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-md bg-mist p-3 text-xs leading-6 text-graphite/75">
                    {entry.originalAIContent}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-graphite/55">
                    修改後內容 / 狀態
                  </p>
                  <div className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-md bg-mist p-3 text-xs leading-6 text-graphite/75">
                    <p className="mb-2 font-semibold text-ink">狀態：{entry.nextStatus}</p>
                    {entry.newContent}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductReport({ product, requestedProductId }: ProductReportProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("report");
  const productT = useTranslations("product");
  const [activeProduct, setActiveProduct] = useState(product);
  const [storedReport, setStoredReport] = useState<StoredLaunchReport | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [translationSections, setTranslationSections] = useState<ReviewedReportSection[]>([]);
  const [reportView, setReportView] = useState<ReportViewMode>("original");
  const [targetLocale, setTargetLocale] = useState<TranslationLocale>(locale === "zh-TW" ? "en" : locale);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationMessage, setTranslationMessage] = useState("");
  const [translationCacheHit, setTranslationCacheHit] = useState(false);
  const expectsLocalProduct = Boolean(requestedProductId && requestedProductId !== product.id);
  const [lookupState, setLookupState] = useState<"pending" | "ready" | "missing">(
    expectsLocalProduct ? "pending" : "ready"
  );

  useEffect(() => {
    const targetId = requestedProductId ?? product.id;
    const storedProduct = findDemoProduct(targetId);

    if (storedProduct) {
      const storedTranslation = findStoredTranslation(storedProduct.id)?.translation ?? null;

      setActiveProduct(storedProduct);
      const localReport = findStoredLaunchReport(storedProduct.id);
      setStoredReport(localReport);
      if (!localReport) {
        void fetchCloudReport(storedProduct.id).then((cloudReport) => {
          if (!cloudReport) return;
          upsertStoredLaunchReport(cloudReport);
          setStoredReport(cloudReport);
        });
      }
      setTranslation(storedTranslation);
      if (storedTranslation) setTargetLocale(storedTranslation.targetLocale);
      setTranslationSections(storedTranslation ? translationToReviewedSections(storedTranslation) : []);
      setLookupState("ready");
      return;
    }

    if (targetId !== product.id) {
      void fetchCloudProduct(targetId).then(async (cloudProduct) => {
        if (!cloudProduct) {
          setLookupState("missing");
          return;
        }

        const cloudReport = await fetchCloudReport(cloudProduct.id);
        if (cloudReport) upsertStoredLaunchReport(cloudReport);
        upsertDemoProduct(cloudProduct);
        setActiveProduct(cloudProduct);
        setStoredReport(cloudReport);
        setLookupState("ready");
      });
      return;
    }

    const storedTranslation = findStoredTranslation(product.id)?.translation ?? null;

    setActiveProduct(product);
    setStoredReport(findStoredLaunchReport(product.id));
    setTranslation(storedTranslation);
    if (storedTranslation) setTargetLocale(storedTranslation.targetLocale);
    setTranslationSections(storedTranslation ? translationToReviewedSections(storedTranslation) : []);
    setLookupState("ready");
  }, [product, requestedProductId]);

  const initialReport = useMemo(
    () => storedReport?.report ?? productToReport(activeProduct),
    [activeProduct, storedReport]
  );
  const initialSections = useMemo(
    () => toReviewedSections(launchReportToSections(initialReport).map((section) => ({ ...section, title: t(`section.${section.id}`) }))),
    [initialReport, t]
  );
  const [sections, setSections] = useState<ReviewedReportSection[]>(initialSections);
  const [auditLogs, setAuditLogs] = useState<ReportAuditLogEntry[]>([]);

  useEffect(() => {
    setSections(initialSections);
    setAuditLogs([]);
  }, [initialSections]);

  const exportReport = useMemo(() => buildExportReport(initialReport, sections), [initialReport, sections]);

  useEffect(() => {
    const cached = readCachedTranslation(activeProduct.id, targetLocale, exportReport);
    if (!cached) return;
    setTranslation(cached);
    setTranslationSections(translationToReviewedSections(cached));
    setTranslationCacheHit(true);
    setTranslationMessage("");
  }, [activeProduct.id, exportReport, targetLocale]);
  const highRiskCount = sections.filter((section) => section.riskLevel === "high").length;
  const editedCount = sections.filter((section) => section.humanEdited).length;
  const approvedCount = sections.filter((section) => section.reviewStatus === "approved").length;
  const rejectedCount = sections.filter((section) => section.reviewStatus === "rejected").length;
  const providerLabel =
    storedReport?.provider === "openai"
      ? "OpenAIProvider"
      : storedReport?.provider === "nvidia"
        ? "NvidiaProvider"
        : "MockAIProvider";
  const modeLabel = initialReport.isMock ? "Demo Mode · 使用範例資料展示流程" : `AI generated · ${providerLabel}`;

  function handleSave(sectionId: string, newContent: string) {
    const target = sections.find((section) => section.id === sectionId);

    if (!target || target.content === newContent) {
      return;
    }

    const nextStatus: ReportReviewStatus = "reviewed";
    const logEntry = createAuditLogEntry({
      section: target,
      action: "edit",
      previousContent: target.content,
      newContent,
      nextStatus
    });

    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              content: newContent,
              humanEdited: true,
              reviewStatus: nextStatus,
              updatedAt: logEntry.createdAt
            }
          : section
      )
    );
    setAuditLogs((current) => [logEntry, ...current]);
  }

  function handleStatusChange(
    sectionId: string,
    nextStatus: Extract<ReportReviewStatus, "approved" | "rejected">
  ) {
    const target = sections.find((section) => section.id === sectionId);

    if (!target || target.reviewStatus === nextStatus) {
      return;
    }

    const action: ReviewAction = nextStatus === "approved" ? "approve" : "reject";
    const logEntry = createAuditLogEntry({
      section: target,
      action,
      previousContent: target.content,
      newContent: target.content,
      nextStatus
    });

    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              reviewStatus: nextStatus,
              updatedAt: logEntry.createdAt
            }
          : section
      )
    );
    setAuditLogs((current) => [logEntry, ...current]);
  }

  async function handleTranslateReport() {
    setIsTranslating(true);
    setTranslationMessage("");

    try {
      const response = await fetch("/api/translate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ report: exportReport, sourceLocale: "zh-TW", targetLocale, productCategory: activeProduct.category })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Translation request failed with ${response.status}`);
      }

      const result = (await response.json()) as TranslateReportApiResponse;
      setTranslation(result.translation);
      setTranslationCacheHit(false);
      setTranslationSections(translationToReviewedSections(result.translation));
      setReportView("translated");
      setTranslationMessage(
        result.warning ??
          `${localeCatalog[targetLocale].name} translation is ready via ${result.provider}. Human review is required.`
      );
      upsertStoredTranslation({
        productId: activeProduct.id,
        translation: result.translation,
        savedAt: new Date().toISOString()
      });
      writeCachedTranslation(activeProduct.id, result.translation, exportReport);
    } catch (error) {
      setTranslationMessage(error instanceof Error ? error.message : "Translation request failed.");
    } finally {
      setIsTranslating(false);
    }
  }

  function handleTranslationSave(sectionId: string, newContent: string) {
    const target = translationSections.find((section) => section.id === sectionId);
    const key = translationKeyFromSectionId(sectionId);

    if (!translation || !target || !key || target.content === newContent) {
      return;
    }

    const nextStatus: ReportReviewStatus = "reviewed";
    const logEntry = createAuditLogEntry({
      section: target,
      action: "edit",
      previousContent: target.content,
      newContent,
      nextStatus
    });
    const nextTranslation: TranslationResult = {
      ...translation,
      sections: {
        ...translation.sections,
        [key]: newContent
      }
    };

    setTranslationSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              content: newContent,
              humanEdited: true,
              reviewStatus: nextStatus,
              updatedAt: logEntry.createdAt
            }
          : section
      )
    );
    setTranslation(nextTranslation);
    upsertStoredTranslation({
      productId: activeProduct.id,
      translation: nextTranslation,
      savedAt: new Date().toISOString()
    });
    writeCachedTranslation(activeProduct.id, nextTranslation, exportReport);
    setAuditLogs((current) => [logEntry, ...current]);
  }

  function handleTranslationStatusChange(
    sectionId: string,
    nextStatus: Extract<ReportReviewStatus, "approved" | "rejected">
  ) {
    const target = translationSections.find((section) => section.id === sectionId);

    if (!target || target.reviewStatus === nextStatus) {
      return;
    }

    const action: ReviewAction = nextStatus === "approved" ? "approve" : "reject";
    const logEntry = createAuditLogEntry({
      section: target,
      action,
      previousContent: target.content,
      newContent: target.content,
      nextStatus
    });

    setTranslationSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              reviewStatus: nextStatus,
              updatedAt: logEntry.createdAt
            }
          : section
      )
    );
    setAuditLogs((current) => [logEntry, ...current]);
  }

  if (lookupState === "pending") {
    return (
      <section className="surface min-h-[32rem] p-5 sm:p-6" aria-busy="true" aria-label="正在讀取本機商品報告">
        <div className="motion-safe:animate-pulse">
          <div className="h-7 w-32 rounded-md bg-amber-100/70" />
          <div className="mt-5 h-10 w-4/5 max-w-3xl rounded-md bg-line/70" />
          <div className="mt-3 h-5 w-full max-w-2xl rounded-md bg-line/50" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 rounded-md bg-mist" />)}
          </div>
        </div>
      </section>
    );
  }

  if (lookupState === "missing") {
    return (
      <EmptyState
        icon={PackageSearch}
        title={productT("missing")}
        description={productT("missingText")}
        action={<Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">{productT("backDashboard")}</Link>}
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-8">
      <section className="surface min-w-0 p-5 sm:p-6">
        <Link
          href={`/products/${activeProduct.id}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-graphite transition hover:bg-mist hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t("back")}
        </Link>
        <div className="mt-5">
          <PageHeader
            eyebrow={
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={initialReport.isMock ? "demo" : "ai-generated"} label={modeLabel} />
                <Badge tone="amber">{providerLabel}</Badge>
                {storedReport?.isFallback ? <StatusBadge status="fallback" label="Fallback 已啟用" /> : null}
              </div>
            }
            title={`${activeProduct.name} ${t("titleSuffix")}`}
            description={t("description")}
          />
            {storedReport?.warning ? (
              <p className="mt-4 whitespace-pre-wrap break-words rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                {storedReport.warning}
              </p>
            ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="amber">{sections.length} {t("sections")}</Badge>
          <Badge tone="coral">{highRiskCount} {t("highRisk")}</Badge>
          <Badge tone="amber">{editedCount} {t("edited")}</Badge>
          <Badge tone="teal">{approvedCount} {t("approved")}</Badge>
          {rejectedCount > 0 ? <Badge tone="coral">{rejectedCount} {t("rejected")}</Badge> : null}
        </div>
      </section>

      <section className="surface min-w-0 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Languages className="h-5 w-5 text-teal-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-ink">{t("translateTitle")}</h2>
              {translation ? (
                <Badge tone={translation.provider === "mock" ? "amber" : "teal"}>
                  {translation.provider === "mock" ? "Mock Translation" : "AI Translated"}
                </Badge>
              ) : null}
              {translationCacheHit ? <TranslationStatusBadge status="cached" /> : null}
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/72">
              {t("translateText")}
            </p>
            {translationMessage ? (
              <p className="mt-3 rounded-md border border-line bg-mist px-3 py-2 text-sm font-semibold text-graphite/78">
                {translationMessage}
              </p>
            ) : null}
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:justify-end">
            <label className="grid gap-1 text-xs font-semibold text-graphite/70">
              {t("target")}
              <select className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink" value={targetLocale} onChange={(event) => { setTargetLocale(event.target.value as TranslationLocale); setTranslation(null); setTranslationSections([]); setTranslationCacheHit(false); setReportView("original"); }}>
                {supportedLocales.filter((item) => item !== "zh-TW").map((item) => <option key={item} value={item}>{localeCatalog[item].name}</option>)}
              </select>
            </label>
            <Button className="w-full sm:col-span-2 lg:w-auto" onClick={() => void handleTranslateReport()} disabled={isTranslating}>
              {isTranslating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
              {t("translate")}
            </Button>
            <Button
              variant="secondary"
              className={reportView === "original" ? "w-full border-teal-500 text-teal-600 lg:w-auto" : "w-full lg:w-auto"}
              onClick={() => setReportView("original")}
            >
              {t("viewOriginal")}
            </Button>
            <Button
              variant="secondary"
              className={reportView === "translated" ? "w-full border-teal-500 text-teal-600 lg:w-auto" : "w-full lg:w-auto"}
              onClick={() => setReportView("translated")}
              disabled={!translation}
            >
              {t("viewTranslated")}
            </Button>
            <Button
              variant="secondary"
              className={reportView === "bilingual" ? "w-full border-teal-500 text-teal-600 lg:w-auto" : "w-full lg:w-auto"}
              onClick={() => setReportView("bilingual")}
              disabled={!translation}
            >
              {t("viewBilingual")}
            </Button>
          </div>
        </div>
      </section>

      <ExportButtonGroup
        report={exportReport}
        fileBaseName={activeProduct.id}
        sourceSections={sections}
        translation={translation}
      />

      <ExportDialog productId={activeProduct.id} />

      <ReportSummary product={activeProduct} report={exportReport} />

      <section className="surface p-5 sm:p-6">
        <LifecycleProgress status={activeProduct.lifecycleStatus} />
      </section>

      <section className="rounded-md border border-teal-100 bg-teal-50 p-4">
        <div className="flex gap-3">
          <UserCheck className="mt-1 h-5 w-5 shrink-0 text-teal-600" aria-hidden="true" />
          <p className="text-sm leading-6 text-teal-700">
            Demo 審核流程：Copy 可快速帶走內容，Edit 會標記 human_edited，Approve / Reject 用來模擬正式上架前的人工把關。
          </p>
        </div>
      </section>

      {reportView === "original" ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <ReportToc sections={sections} />
          <div className="grid min-w-0 gap-4">
            {sections.map((section) => (
              <EditableReportSection
                key={section.id}
                section={section}
                onSave={handleSave}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      ) : translation ? (
        reportView === "translated" ? (
          <div dir={isRtlLocale(translation.targetLocale) ? "rtl" : "ltr"}>
          <EnglishReportSections
            translation={translation}
            translationSections={translationSections}
            onSave={handleTranslationSave}
            onStatusChange={handleTranslationStatusChange}
          />
          </div>
        ) : (
          <BilingualReportSections sourceReport={exportReport} sourceSections={sections} translation={translation} />
        )
      ) : (
        <section className="surface p-5">
          <Badge tone="amber">{t("notGenerated")}</Badge>
          <p className="mt-3 text-sm leading-6 text-graphite/72">
            {t("notGeneratedText")}
          </p>
        </section>
      )}

      <LegalRiskPanel />

      <AuditLogPanel entries={auditLogs} />
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

async function fetchCloudReport(productId: string): Promise<StoredLaunchReport | null> {
  try {
    const response = await fetch(`/api/reports?productId=${encodeURIComponent(productId)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { report?: CloudReportRow | null };
    const row = data.report;
    if (!row?.report) return null;

    return {
      productId,
      report: row.report,
      provider: row.provider,
      requestedProvider: row.provider,
      isFallback: row.is_fallback ?? false,
      isAiGenerated: true,
      model: row.model ?? undefined,
      validationPassed: row.validation_passed ?? undefined,
      generatedAt: row.generated_at ?? row.created_at ?? new Date().toISOString()
    };
  } catch {
    return null;
  }
}

type CloudReportRow = {
  report: LaunchReport;
  provider: StoredLaunchReport["provider"];
  model?: string | null;
  is_fallback?: boolean | null;
  validation_passed?: boolean | null;
  generated_at?: string | null;
  created_at?: string | null;
};
