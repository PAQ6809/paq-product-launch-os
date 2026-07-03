import { LAUNCH_REPORT_JSON_SCHEMA } from "@/lib/ai/schemas/launch-report-json-schema";
import type { LaunchReportInput } from "@/types/report";

export const LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION = `
請輸出完整 LaunchReport JSON，必須包含 legacy 欄位與 v0.4.8 analysis/metadata 欄位：
- legacy: productName, category, generatedAt, isMock, positioning, targetAudienceAnalysis, keySellingPoints, competitorAnalysis, pricingStrategy, packagingBrief, frontPackagingCopy, backPackagingCopy, productTitle, shortDescription, longDescription, seoKeywords, socialPosts, videoScripts, faqs, customerServiceScripts, launchChecklist, firstMonthMarketingPlan, optimizationSuggestions, legalRiskNotes
- analysis: executiveSummary, productDiagnosis, positioningAnalysis, targetAudience, competitiveStrategy, pricingAnalysis, packagingStrategy, listingCopy, marketingPlan, socialContent, customerSupport, legalRiskAssessment, nextActions
- metadata: provider, model, isAiGenerated, isFallback, generatedAt, assumptionsUsed, confidenceLevel, validationPassed, warnings
`.trim();

type ProductLaunchPromptOptions = {
  includeJsonSchema?: boolean;
  provider?: "openai" | "nvidia";
  model?: string;
};

export function buildProductLaunchUserPrompt(
  input: LaunchReportInput,
  options: ProductLaunchPromptOptions = {}
) {
  const channels = input.salesChannels.length > 0 ? input.salesChannels.join(", ") : "未提供";
  const missing = [
    ["商品功能", input.features],
    ["目標客群", input.targetAudience],
    ["品牌風格", input.brandStyle],
    ["銷售通路", channels === "未提供" ? "" : channels]
  ]
    .filter(([, value]) => !String(value).trim())
    .map(([label]) => label);
  const schemaBlock = options.includeJsonSchema
    ? `\nJSON Schema:\n${JSON.stringify(LAUNCH_REPORT_JSON_SCHEMA)}`
    : "";

  return `
請為以下商品產出 PAQ Product Launch OS 商品上市企劃報告。

商品資料：
- 商品名稱：${input.productName}
- 商品類別：${input.category}
- 商品功能 / 特色：${input.features || "未提供"}
- 成本：${input.cost}
- 預計售價：${input.targetPrice}
- 目標客群：${input.targetAudience || "未提供"}
- 品牌風格：${input.brandStyle || "未提供"}
- 銷售通路：${channels}
- 商品圖片 URL：${input.imageUrl || "未提供"}
- 目前缺少的欄位：${missing.length > 0 ? missing.join(", ") : "無明顯缺漏"}

分析要求：
1. 不要套模板。請把每個判斷連回商品名稱、類別、售價、成本、客群、功能與通路。
2. 必須列出 assumptionsUsed 與 missingInformation。
3. competitorAnalysis / competitiveStrategy 可以使用「可能競品類型」與「市場常見競品假設」，但不可宣稱已做真實網路爬取。
4. pricingStrategy / pricingAnalysis 必須引用成本、售價與毛利邏輯。
5. listingCopy、socialPosts、videoScripts、FAQ、customerServiceScripts 必須能直接給店家討論或複製。
6. nextActions 至少 4 項，需標示 priority、reason、expectedImpact、effort。
7. 請避免保證銷售、療效、治療、改善疾病、100% 有效等高風險宣稱。
8. 請輸出繁體中文 JSON，不要輸出 markdown code block。
9. metadata.provider 請填 ${options.provider ?? "openai"}，metadata.model 請填 ${options.model ?? "configured-model"}，metadata.isAiGenerated=true，metadata.isFallback=false。

${LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION}
${schemaBlock}
`.trim();
}
