import type { LaunchReportInput } from "@/types/report";

export const LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION = `
請輸出符合以下 TypeScript 形狀的 JSON object：

{
  "productName": "string",
  "category": "string",
  "generatedAt": "ISO-8601 string",
  "isMock": false,
  "positioning": "string",
  "targetAudienceAnalysis": "string",
  "keySellingPoints": ["string"],
  "competitorAnalysis": [
    {
      "name": "string",
      "positioning": "string",
      "priceRange": "string",
      "strength": "string",
      "gap": "string"
    }
  ],
  "pricingStrategy": {
    "suggestedPrice": 0,
    "floorPrice": 0,
    "premiumPrice": 0,
    "marginRate": 0,
    "rationale": "string",
    "promoNotes": "string"
  },
  "packagingBrief": {
    "concept": "string",
    "visualDirection": "string",
    "materials": "string",
    "requiredElements": ["string"],
    "complianceNotes": ["string"]
  },
  "frontPackagingCopy": "string",
  "backPackagingCopy": "string",
  "productTitle": "string",
  "shortDescription": "string",
  "longDescription": "string",
  "seoKeywords": ["string"],
  "socialPosts": [
    {
      "platform": "IG | Threads | TikTok",
      "caption": "string",
      "hashtags": ["string"],
      "cta": "string"
    }
  ],
  "videoScripts": [
    {
      "title": "string",
      "durationSeconds": 0,
      "hook": "string",
      "scenes": ["string"],
      "cta": "string"
    }
  ],
  "faqs": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "customerServiceScripts": [
    {
      "scenario": "string",
      "response": "string"
    }
  ],
  "launchChecklist": [
    {
      "phase": "string",
      "task": "string",
      "ownerHint": "string"
    }
  ],
  "firstMonthMarketingPlan": [
    {
      "week": "string",
      "focus": "string",
      "actions": ["string"],
      "metric": "string"
    }
  ],
  "optimizationSuggestions": [
    {
      "signal": "string",
      "action": "string",
      "why": "string"
    }
  ]
}
`.trim();

export function buildProductLaunchUserPrompt(input: LaunchReportInput) {
  return `
請根據以下商品資料，產生 PAQ Product Launch OS 商品上市報告。

商品資料：
${JSON.stringify(input, null, 2)}

內容要求：
1. 請輸出具體、可執行、像真實企劃書的內容。
2. 請根據商品類別、成本、預計售價、目標客群、品牌風格與銷售平台調整語氣與策略。
3. 至少提供 3 個競品策略參考，但不得捏造真實品牌銷售數據。
4. 社群文案需包含 IG、Threads、TikTok。
5. 短影音腳本需可直接交給影音或社群人員改稿。
6. FAQ 與客服話術需避免過度承諾。
7. 食品、美妝、醫療、保健品或任何法規敏感商品，必須加入人工法規審核提醒。
8. 不得亂宣稱療效、治療、改善疾病、預防疾病或保證銷售成效。
9. 不得建議侵犯商標、版權、肖像權或平台規則的做法。

JSON output schema instruction：
${LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION}

請再次確認：最終回覆只能是 JSON object，不能包含 Markdown code fence，且必須可被 JSON.parse() 解析。
`.trim();
}
