import { LAUNCH_REPORT_JSON_SCHEMA } from "@/lib/ai/schemas/launch-report-json-schema";
import type { LaunchReportInput } from "@/types/report";

export const LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION = `
請輸出一個 LaunchReport JSON object，欄位必須完整包含：
- productName, category, generatedAt, isMock
- positioning, targetAudienceAnalysis, keySellingPoints
- competitorAnalysis, pricingStrategy, packagingBrief
- frontPackagingCopy, backPackagingCopy
- productTitle, shortDescription, longDescription
- seoKeywords, socialPosts, videoScripts
- faqs, customerServiceScripts, launchChecklist
- firstMonthMarketingPlan, optimizationSuggestions, legalRiskNotes

所有字串不得為空，所有陣列不得為空。socialPosts 至少包含 IG、Threads、TikTok 三種平台。generatedAt 使用 ISO-8601 字串。isMock 必須為 false。
`.trim();

type ProductLaunchPromptOptions = {
  includeJsonSchema?: boolean;
};

export function buildProductLaunchUserPrompt(
  input: LaunchReportInput,
  options: ProductLaunchPromptOptions = {}
) {
  const schemaBlock = options.includeJsonSchema
    ? `\n請嚴格遵守以下 JSON Schema：\n${JSON.stringify(LAUNCH_REPORT_JSON_SCHEMA)}`
    : "";

  return `
請根據以下商品資料，產生一份 PAQ Product Launch OS 商品上市企劃報告。

商品名稱：${input.productName}
商品類別：${input.category}
商品功能：${input.features}
商品成本：${input.cost}
預計售價：${input.targetPrice}
目標客群：${input.targetAudience}
品牌風格：${input.brandStyle}
銷售平台：${input.salesChannels.join("、") || "未設定"}
商品圖片 URL：${input.imageUrl || "未提供"}

輸出要求：
1. 內容要像可以交給店家討論的企劃書，不要太空泛。
2. 請根據商品類別、成本、售價、目標客群、品牌風格與銷售平台調整語氣與策略。
3. 競品分析請使用通用競品類型，不要捏造真實市場數據。
4. 社群文案需包含 IG、Threads、TikTok。
5. 短影音腳本需可直接交給影音或社群人員改稿。
6. FAQ 與客服話術需回答常見購買疑慮。
7. 若商品涉及食品、美妝、保健、醫療、香氛或可能接觸身體，請在 legalRiskNotes 加入人工審核與法規提醒。
8. 不得使用「保證療效」「治療」「改善疾病」「保證銷售」「月收保證」或同義英文宣稱。
9. 只輸出 JSON object，不得輸出 Markdown code block、前言或結語。
10. 內容保持精簡可執行：核心賣點 3-5 項、競品類型 3 項、社群貼文 3 項、短影音 1-2 支、FAQ 3 項、客服話術 3 項、上架清單 6 項、首月計畫 4 週、優化建議 3 項、法規提醒 4 項。

${LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION}${schemaBlock}
`.trim();
}
