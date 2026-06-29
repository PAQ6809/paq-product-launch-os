import { productAnalysisTemplate } from "@/lib/report-builder/templates/product-analysis-template";
import type {
  NormalizedProductAnalysisReport,
  ReportBuilderMetadata,
  ReportTemplateSection
} from "@/lib/report-builder/types";
import type { Product } from "@/types";
import type { LaunchReport } from "@/types/report";

const NOT_PROVIDED = "Not provided";

export function normalizeReportToTemplate(
  product: Product,
  report: LaunchReport,
  metadata: ReportBuilderMetadata = {}
): NormalizedProductAnalysisReport {
  const exportedAt = metadata.exportedAt ?? new Date().toISOString();
  const sections: ReportTemplateSection[] = [
    section("cover", "Cover", [
      `Report title: ${product.name} Product Launch Analysis`,
      `Product name: ${value(product.name)}`,
      `Prepared for: ${value(metadata.exportedBy ?? "Workspace owner")}`,
      `Generated at: ${value(report.generatedAt)}`,
      "Confidentiality notice: This report may contain product strategy, pricing, positioning, and AI-generated planning content. Review before sharing."
    ]),
    section("executive-summary", "Executive Summary", [
      `Product overview: ${value(report.shortDescription || product.features)}`,
      `Core positioning: ${value(report.positioning)}`,
      `Top recommendations: ${list(report.optimizationSuggestions.slice(0, 3).map((item) => `${item.action} (${item.why})`))}`,
      `Key risks: ${list(report.legalRiskNotes.slice(0, 4))}`
    ]),
    section("product-profile", "Product Profile", [
      `Category: ${value(product.category)}`,
      `Features: ${value(product.features)}`,
      `Cost: ${formatMoney(product.cost)}`,
      `Target price: ${formatMoney(product.expectedPrice)}`,
      `Sales channels: ${list(product.salesPlatforms)}`,
      `Lifecycle status: ${value(product.lifecycleStatus)}`
    ]),
    section("market-positioning", "Market Positioning", [
      `Positioning statement: ${value(report.positioning)}`,
      `Target audience: ${value(report.targetAudienceAnalysis || product.targetAudience)}`,
      `Pain points: ${list(report.keySellingPoints.slice(0, 3))}`,
      `Differentiators: ${list(report.keySellingPoints)}`
    ]),
    section("competitive-analysis", "Competitive Analysis", [
      `Competitor summary: ${list(report.competitorAnalysis.map((item) => `${item.name}: ${item.strength}`))}`,
      `Price comparison: ${list(report.competitorAnalysis.map((item) => `${item.name}: ${item.priceRange}`))}`,
      `Positioning gap: ${list(report.competitorAnalysis.map((item) => item.gap))}`,
      `Recommended angle: ${value(report.positioning)}`
    ]),
    section("pricing-strategy", "Pricing Strategy", [
      `Suggested price: ${formatMoney(report.pricingStrategy.suggestedPrice)}`,
      `Margin notes: ${value(`${report.pricingStrategy.marginRate}% margin target`)}`,
      `Promotion strategy: ${value(report.pricingStrategy.promoNotes)}`,
      `Bundle opportunity: ${value(report.pricingStrategy.rationale)}`
    ]),
    section("packaging-strategy", "Packaging Strategy", [
      `Packaging brief: ${value(report.packagingBrief.concept)}`,
      `Front copy: ${value(report.frontPackagingCopy)}`,
      `Back copy: ${value(report.backPackagingCopy)}`,
      `Material / visual direction: ${value(`${report.packagingBrief.materials}; ${report.packagingBrief.visualDirection}`)}`,
      `Compliance notes: ${list(report.packagingBrief.complianceNotes)}`
    ]),
    section("listing-copy", "Listing Copy", [
      `Product title: ${value(report.productTitle)}`,
      `Short description: ${value(report.shortDescription)}`,
      `Long description: ${value(report.longDescription)}`,
      `SEO keywords: ${list(report.seoKeywords)}`,
      `Platform notes: ${list(product.salesPlatforms.map((platform) => `${platform}: review category, claims, images, and shipping rules before publishing.`))}`
    ]),
    section("marketing-assets", "Marketing Assets", [
      `Social posts: ${list(report.socialPosts.map((post) => `${post.platform}: ${post.caption}`))}`,
      `Video scripts: ${list(report.videoScripts.map((script) => `${script.title}: ${script.hook}`))}`,
      `Launch checklist: ${list(report.launchChecklist.map((item) => `${item.phase}: ${item.task}`))}`,
      `First month plan: ${list(report.firstMonthMarketingPlan.map((item) => `${item.week}: ${item.focus}`))}`
    ]),
    section("customer-communication", "Customer Communication", [
      `FAQ: ${list(report.faqs.map((faq) => `${faq.question} ${faq.answer}`))}`,
      `Customer service scripts: ${list(report.customerServiceScripts.map((script) => `${script.scenario}: ${script.response}`))}`,
      "Objection handling: Review customer objections manually before use in regulated categories."
    ]),
    section("risk-and-compliance", "Risk and Compliance Notes", [
      `Legal risk notes: ${list(report.legalRiskNotes)}`,
      "Platform policy notes: Check platform rules and local regulations before publishing.",
      "AI content review reminder: AI-generated content requires human review and approval."
    ]),
    section("next-actions", "Next Actions", [
      `Priority tasks: ${list(report.launchChecklist.slice(0, 5).map((item) => item.task))}`,
      "Owner placeholder: Assign owner before production launch.",
      "Due date placeholder: Add deadlines in the workspace or external project tracker."
    ]),
    section("appendix", "Appendix", [
      `AI provider metadata: ${value(metadata.provider ? `${metadata.provider} / ${metadata.model ?? NOT_PROVIDED}` : undefined)}`,
      `Validation status: ${metadata.validationPassed === undefined ? NOT_PROVIDED : metadata.validationPassed ? "Passed" : "Needs review"}`,
      `Reviewer notes: ${value(metadata.reviewerNotes)}`,
      `Export metadata: Exported at ${exportedAt}`
    ])
  ];

  return {
    templateId: productAnalysisTemplate.id,
    title: `${product.name} Product Launch Analysis`,
    productName: product.name,
    preparedFor: metadata.exportedBy ?? "Workspace owner",
    generatedAt: exportedAt,
    confidentialityNotice: "Confidential. Contains product strategy, pricing, AI-generated content, and review notes.",
    sections,
    source: { product, report, metadata: { ...metadata, exportedAt } }
  };
}

function section(id: ReportTemplateSection["id"], title: string, items: string[]): ReportTemplateSection {
  return { id, title, items: items.map((item) => item || NOT_PROVIDED) };
}

function value(value: string | number | undefined | null) {
  const normalized = String(value ?? "").trim();
  return normalized || NOT_PROVIDED;
}

function list(items: string[]) {
  const filtered = items.map((item) => item.trim()).filter(Boolean);
  return filtered.length ? filtered.join("; ") : NOT_PROVIDED;
}

function formatMoney(value: number) {
  return Number.isFinite(value) && value > 0 ? `NT$${value.toLocaleString("zh-TW")}` : NOT_PROVIDED;
}
