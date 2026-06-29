import { formatCurrency } from "@/lib/utils";
import type {
  CompetitorInsight,
  CustomerServiceScript,
  FAQ,
  FirstMonthMarketingPlanItem,
  LaunchChecklistItem,
  LaunchReport,
  OptimizationSuggestion,
  SocialPost,
  TranslationSectionKey,
  TranslationSections,
  VideoScript
} from "@/types/report";

export type TranslationSectionMeta = {
  key: TranslationSectionKey;
  sourceSectionId: string;
  zhTitle: string;
  enTitle: string;
};

export const translationSectionMetas: TranslationSectionMeta[] = [
  { key: "positioning", sourceSectionId: "positioning", zhTitle: "商品定位", enTitle: "Product Positioning" },
  {
    key: "targetAudienceAnalysis",
    sourceSectionId: "target-audience",
    zhTitle: "目標客群分析",
    enTitle: "Target Audience Analysis"
  },
  { key: "keySellingPoints", sourceSectionId: "key-selling-points", zhTitle: "核心賣點", enTitle: "Key Selling Points" },
  { key: "competitorAnalysis", sourceSectionId: "competitor-analysis", zhTitle: "競品分析", enTitle: "Competitor Analysis" },
  { key: "pricingStrategy", sourceSectionId: "pricing-strategy", zhTitle: "定價建議", enTitle: "Pricing Strategy" },
  { key: "packagingBrief", sourceSectionId: "packaging-brief", zhTitle: "包裝設計 brief", enTitle: "Packaging Design Brief" },
  {
    key: "frontPackagingCopy",
    sourceSectionId: "front-packaging-copy",
    zhTitle: "包裝正面文案",
    enTitle: "Front Packaging Copy"
  },
  {
    key: "backPackagingCopy",
    sourceSectionId: "back-packaging-copy",
    zhTitle: "包裝背面文案",
    enTitle: "Back Packaging Copy"
  },
  { key: "productTitle", sourceSectionId: "listing-copy", zhTitle: "商品頁標題", enTitle: "Product Page Title" },
  { key: "shortDescription", sourceSectionId: "listing-copy", zhTitle: "商品短描述", enTitle: "Short Description" },
  { key: "longDescription", sourceSectionId: "listing-copy", zhTitle: "商品長描述", enTitle: "Long Description" },
  { key: "seoKeywords", sourceSectionId: "seo-keywords", zhTitle: "SEO 關鍵字", enTitle: "SEO Keywords" },
  { key: "socialPosts", sourceSectionId: "social-posts", zhTitle: "社群貼文", enTitle: "Social Posts" },
  { key: "videoScripts", sourceSectionId: "video-scripts", zhTitle: "短影音腳本", enTitle: "Short-form Video Scripts" },
  { key: "faqs", sourceSectionId: "faqs", zhTitle: "FAQ", enTitle: "FAQ" },
  {
    key: "customerServiceScripts",
    sourceSectionId: "customer-service-scripts",
    zhTitle: "客服話術",
    enTitle: "Customer Service Scripts"
  },
  { key: "launchChecklist", sourceSectionId: "launch-checklist", zhTitle: "上架檢查清單", enTitle: "Launch Checklist" },
  {
    key: "firstMonthMarketingPlan",
    sourceSectionId: "first-month-marketing-plan",
    zhTitle: "首月行銷計畫",
    enTitle: "First-month Marketing Plan"
  },
  {
    key: "optimizationSuggestions",
    sourceSectionId: "optimization-suggestions",
    zhTitle: "銷售後優化建議",
    enTitle: "Post-launch Optimization Suggestions"
  },
  {
    key: "legalRiskNotes",
    sourceSectionId: "legal-risk-notes",
    zhTitle: "法規與風險提醒",
    enTitle: "Legal and Risk Notes"
  }
];

export const translationSectionKeys = translationSectionMetas.map((meta) => meta.key);

export function buildTranslationSourceSections(report: LaunchReport): TranslationSections {
  return {
    positioning: report.positioning,
    targetAudienceAnalysis: report.targetAudienceAnalysis,
    keySellingPoints: formatList(report.keySellingPoints),
    competitorAnalysis: formatCompetitors(report.competitorAnalysis),
    pricingStrategy: [
      `建議售價：${formatCurrency(report.pricingStrategy.suggestedPrice)}`,
      `最低可接受價格：${formatCurrency(report.pricingStrategy.floorPrice)}`,
      `高值感測試價格：${formatCurrency(report.pricingStrategy.premiumPrice)}`,
      `預估毛利率：${report.pricingStrategy.marginRate}%`,
      report.pricingStrategy.rationale,
      report.pricingStrategy.promoNotes
    ].join("\n"),
    packagingBrief: [
      `概念：${report.packagingBrief.concept}`,
      `視覺方向：${report.packagingBrief.visualDirection}`,
      `材質與量產注意：${report.packagingBrief.materials}`,
      `必要元素：\n${formatList(report.packagingBrief.requiredElements)}`,
      `合規提醒：\n${formatList(report.packagingBrief.complianceNotes)}`
    ].join("\n\n"),
    frontPackagingCopy: report.frontPackagingCopy,
    backPackagingCopy: report.backPackagingCopy,
    productTitle: report.productTitle,
    shortDescription: report.shortDescription,
    longDescription: report.longDescription,
    seoKeywords: report.seoKeywords.join(", "),
    socialPosts: formatSocialPosts(report.socialPosts),
    videoScripts: formatVideoScripts(report.videoScripts),
    faqs: formatFaqs(report.faqs),
    customerServiceScripts: formatCustomerServiceScripts(report.customerServiceScripts),
    launchChecklist: formatChecklist(report.launchChecklist),
    firstMonthMarketingPlan: formatFirstMonthPlan(report.firstMonthMarketingPlan),
    optimizationSuggestions: formatOptimization(report.optimizationSuggestions),
    legalRiskNotes: formatList(report.legalRiskNotes)
  };
}

function formatList(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function formatCompetitors(items: CompetitorInsight[]) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name}\n定位：${item.positioning}\n價格帶：${item.priceRange}\n優勢：${item.strength}\n可切入缺口：${item.gap}`
    )
    .join("\n\n");
}

function formatSocialPosts(items: SocialPost[]) {
  return items.map((item) => `[${item.platform}]\n${item.caption}\n${item.hashtags.join(" ")}\nCTA：${item.cta}`).join("\n\n");
}

function formatVideoScripts(items: VideoScript[]) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.title} (${item.durationSeconds} 秒)\nHook：${item.hook}\n${formatList(item.scenes)}\nCTA：${item.cta}`
    )
    .join("\n\n");
}

function formatFaqs(items: FAQ[]) {
  return items.map((item) => `Q：${item.question}\nA：${item.answer}`).join("\n\n");
}

function formatCustomerServiceScripts(items: CustomerServiceScript[]) {
  return items.map((item, index) => `${index + 1}. 情境：${item.scenario}\n回覆：${item.response}`).join("\n\n");
}

function formatChecklist(items: LaunchChecklistItem[]) {
  return items.map((item, index) => `${index + 1}. [${item.phase}] ${item.task}\n建議負責：${item.ownerHint}`).join("\n\n");
}

function formatFirstMonthPlan(items: FirstMonthMarketingPlanItem[]) {
  return items
    .map((item) => `${item.week}｜${item.focus}\n行動：\n${formatList(item.actions)}\n觀察指標：${item.metric}`)
    .join("\n\n");
}

function formatOptimization(items: OptimizationSuggestion[]) {
  return items.map((item, index) => `${index + 1}. 訊號：${item.signal}\n建議行動：${item.action}\n原因：${item.why}`).join("\n\n");
}
