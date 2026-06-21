"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, History, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LifecycleProgress } from "@/components/product/LifecycleProgress";
import { EditableReportSection } from "@/components/report/EditableReportSection";
import { ExportButtonGroup } from "@/components/report/ExportButtonGroup";
import { ReportToc } from "@/components/report/ReportToc";
import { generateMockLaunchReport, launchReportToSections } from "@/lib/ai/mock-generate-launch-report";
import { findDemoProduct } from "@/lib/storage/local-demo-store";
import { formatCurrency, lifecycleLabels } from "@/lib/utils";
import type {
  LaunchReport,
  Product,
  ReportAuditLogEntry,
  ReportReviewStatus,
  ReportSection,
  ReviewedReportSection,
  ReviewAction
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

function formatChannels(channels: string[]) {
  return channels.length > 0 ? channels.join("、") : "尚未設定";
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
    optimizationSuggestions: report.optimizationSuggestions.map((item) => ({ ...item }))
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

  return next;
}

function ReportSummary({ product, report }: { product: Product; report: LaunchReport }) {
  const summaryItems = [
    { label: "商品名稱", value: product.name },
    { label: "商品類別", value: product.category },
    { label: "建議售價", value: formatCurrency(report.pricingStrategy.suggestedPrice) },
    { label: "目標客群", value: product.targetAudience },
    { label: "主要銷售通路", value: formatChannels(product.salesPlatforms) },
    { label: "目前生命週期狀態", value: lifecycleLabels[product.lifecycleStatus] }
  ];

  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone="teal">上市企劃摘要</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-ink">這份報告先看這裡</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/75">
            先用一頁摘要抓住商品定位、價格、客群與通路，再往下看完整上市企劃細節。
          </p>
        </div>
        <Badge tone="amber">{lifecycleLabels[product.lifecycleStatus]}</Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-semibold text-graphite/55">{item.label}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-teal-100 bg-teal-50 p-4">
        <p className="text-xs font-semibold text-teal-700">核心定位一句話</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink">
          {getPositioningOneLiner(report.positioning)}
        </p>
      </div>
    </section>
  );
}

function LegalRiskPanel() {
  const items = [
    "AI 產出內容需人工審核，不可直接作為正式上架或對外宣稱。",
    "包裝設計、商品圖片、插圖、字體、音樂與素材需確認商用授權。",
    "食品、美妝、保健、醫療相關商品不得宣稱療效、治療、改善疾病或保證效果。",
    "實際上架前需依銷售平台規則與當地法規檢查分類、標示、廣告語與禁售規範。"
  ];

  return (
    <section className="rounded-md border border-amber-100 bg-amber-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-ink">法規與風險提醒</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-800">
            {items.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AuditLogPanel({ entries }: { entries: ReportAuditLogEntry[] }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-teal-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-ink">Audit log mock</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-graphite/72">
        第一版先存在前端 state，記錄誰修改、修改哪個 section、修改時間、原始 AI 內容與修改後內容。未來可對應資料表 audit_logs。
      </p>

      {entries.length === 0 ? (
        <p className="mt-4 rounded-md border border-line bg-white p-4 text-sm text-graphite/70">
          尚未有人工編輯或審核紀錄。
        </p>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">
                    原始 AI 內容
                  </p>
                  <div className="mt-2 max-h-44 overflow-auto rounded-md bg-mist p-3 text-xs leading-6 text-graphite/75">
                    {entry.originalAIContent}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">
                    修改後內容 / 狀態
                  </p>
                  <div className="mt-2 max-h-44 overflow-auto rounded-md bg-mist p-3 text-xs leading-6 text-graphite/75">
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

  const initialReport = useMemo(() => productToReport(activeProduct), [activeProduct]);
  const initialSections = useMemo(
    () => toReviewedSections(launchReportToSections(initialReport)),
    [initialReport]
  );
  const [sections, setSections] = useState<ReviewedReportSection[]>(initialSections);
  const [auditLogs, setAuditLogs] = useState<ReportAuditLogEntry[]>([]);

  useEffect(() => {
    setSections(initialSections);
    setAuditLogs([]);
  }, [initialSections]);

  const exportReport = useMemo(() => buildExportReport(initialReport, sections), [initialReport, sections]);
  const highRiskCount = sections.filter((section) => section.riskLevel === "high").length;
  const editedCount = sections.filter((section) => section.humanEdited).length;
  const approvedCount = sections.filter((section) => section.reviewStatus === "approved").length;
  const rejectedCount = sections.filter((section) => section.reviewStatus === "rejected").length;

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

  if (lookupState === "pending") {
    return (
      <section className="surface p-6">
        <Badge tone="amber">Local demo data</Badge>
        <h1 className="mt-4 text-2xl font-semibold text-ink">正在讀取本機商品報告...</h1>
        <p className="mt-3 text-sm leading-6 text-graphite/75">
          這份報告會從 localStorage 讀取商品資料後再產生，避免顯示錯誤 demo 商品。
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
      <section className="surface p-5 sm:p-6">
        <Link
          href={`/products/${activeProduct.id}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-graphite transition hover:bg-mist hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          回商品詳情
        </Link>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="teal">Demo Mode · 使用範例資料展示流程</Badge>
            <h1 className="mt-4 text-3xl font-semibold text-ink sm:text-4xl">
              {activeProduct.name} 商品上市企劃報告
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-graphite/75">
              這份報告使用範例資料展示完整流程，內容可複製、可匯出，也可在每個 section 進行人工編輯與審核。
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="amber">{sections.length} 個報告 section</Badge>
          <Badge tone="coral">{highRiskCount} 個需審核 section</Badge>
          <Badge tone="amber">{editedCount} 個 human_edited</Badge>
          <Badge tone="teal">{approvedCount} 個 approved</Badge>
          {rejectedCount > 0 ? <Badge tone="coral">{rejectedCount} 個 rejected</Badge> : null}
        </div>
      </section>

      <ExportButtonGroup report={exportReport} fileBaseName={activeProduct.id} />

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

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <ReportToc sections={sections} />
        <div className="grid gap-4">
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

      <LegalRiskPanel />

      <AuditLogPanel entries={auditLogs} />
    </div>
  );
}
