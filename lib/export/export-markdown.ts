import type { LaunchReport } from "@/types/report";
import { formatCurrency } from "@/lib/utils";

const legalReminder =
  "法規提醒：此內容為 AI / human review 後的商品企劃模板，不代表已完成法規、商標、版權或平台規則審查。食品、美妝、醫療、保健品與高風險宣稱需由真人審核後才可上架。";

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function exportLaunchReportMarkdown(report: LaunchReport) {
  const lines = [
    `# ${report.productName} 商品上市報告`,
    "",
    `> ${legalReminder}`,
    "",
    "## 商品定位",
    report.positioning,
    "",
    "## 目標客群分析",
    report.targetAudienceAnalysis,
    "",
    "## 核心賣點",
    list(report.keySellingPoints),
    "",
    "## 競品分析",
    ...report.competitorAnalysis.flatMap((competitor, index) => [
      `### ${index + 1}. ${competitor.name}`,
      `- 定位：${competitor.positioning}`,
      `- 價格帶：${competitor.priceRange}`,
      `- 強項：${competitor.strength}`,
      `- 可切入缺口：${competitor.gap}`,
      ""
    ]),
    "## 定價建議",
    `- 建議售價：${formatCurrency(report.pricingStrategy.suggestedPrice)}`,
    `- 最低可守價格：${formatCurrency(report.pricingStrategy.floorPrice)}`,
    `- 高階組合價格：${formatCurrency(report.pricingStrategy.premiumPrice)}`,
    `- 粗估毛利率：${report.pricingStrategy.marginRate}%`,
    "",
    report.pricingStrategy.rationale,
    "",
    report.pricingStrategy.promoNotes,
    "",
    "## 包裝設計 brief",
    `- 概念：${report.packagingBrief.concept}`,
    `- 視覺方向：${report.packagingBrief.visualDirection}`,
    `- 材質與結構：${report.packagingBrief.materials}`,
    "",
    "必要元素：",
    list(report.packagingBrief.requiredElements),
    "",
    "法規與授權注意：",
    list(report.packagingBrief.complianceNotes),
    "",
    "## 包裝正面文案",
    report.frontPackagingCopy,
    "",
    "## 包裝背面文案",
    report.backPackagingCopy,
    "",
    "## 商品頁文案",
    `### 商品頁標題\n${report.productTitle}`,
    "",
    `### 商品短描述\n${report.shortDescription}`,
    "",
    `### 商品長描述\n${report.longDescription}`,
    "",
    "## SEO 關鍵字",
    report.seoKeywords.join("、"),
    "",
    "## 社群貼文",
    ...report.socialPosts.flatMap((post) => [
      `### ${post.platform}`,
      post.caption,
      "",
      post.hashtags.join(" "),
      "",
      `CTA：${post.cta}`,
      ""
    ]),
    "## 短影音腳本",
    ...report.videoScripts.flatMap((script) => [
      `### ${script.title}（${script.durationSeconds} 秒）`,
      `Hook：${script.hook}`,
      "",
      list(script.scenes),
      "",
      `CTA：${script.cta}`,
      ""
    ]),
    "## FAQ",
    ...report.faqs.flatMap((faq) => [`Q：${faq.question}`, `A：${faq.answer}`, ""]),
    "## 客服回覆話術",
    ...report.customerServiceScripts.flatMap((script) => [
      `### ${script.scenario}`,
      script.response,
      ""
    ]),
    "## 上架檢查清單",
    ...report.launchChecklist.flatMap((item) => [
      `- [ ] ${item.phase}｜${item.task}`,
      `  - 負責建議：${item.ownerHint}`
    ]),
    "",
    "## 首月行銷計畫",
    ...report.firstMonthMarketingPlan.flatMap((item) => [
      `### ${item.week}｜${item.focus}`,
      list(item.actions),
      `觀察指標：${item.metric}`,
      ""
    ]),
    "## 銷售後優化建議",
    ...report.optimizationSuggestions.flatMap((item) => [
      `- 訊號：${item.signal}`,
      `  - 建議行動：${item.action}`,
      `  - 原因：${item.why}`
    ]),
    "",
    "## 法規與風險提醒",
    list(report.legalRiskNotes),
    "",
    "---",
    legalReminder
  ];

  return lines.join("\n");
}
