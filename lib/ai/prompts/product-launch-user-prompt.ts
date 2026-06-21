import type { LaunchReportInput } from "@/types/report";

export const LAUNCH_REPORT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "productName",
    "category",
    "generatedAt",
    "isMock",
    "positioning",
    "targetAudienceAnalysis",
    "keySellingPoints",
    "competitorAnalysis",
    "pricingStrategy",
    "packagingBrief",
    "frontPackagingCopy",
    "backPackagingCopy",
    "productTitle",
    "shortDescription",
    "longDescription",
    "seoKeywords",
    "socialPosts",
    "videoScripts",
    "faqs",
    "customerServiceScripts",
    "launchChecklist",
    "firstMonthMarketingPlan",
    "optimizationSuggestions"
  ],
  properties: {
    productName: { type: "string" },
    category: { type: "string" },
    generatedAt: { type: "string" },
    isMock: { type: "boolean" },
    positioning: { type: "string" },
    targetAudienceAnalysis: { type: "string" },
    keySellingPoints: stringArraySchema(),
    competitorAnalysis: arrayOfObject({
      name: { type: "string" },
      positioning: { type: "string" },
      priceRange: { type: "string" },
      strength: { type: "string" },
      gap: { type: "string" }
    }),
    pricingStrategy: objectSchema({
      suggestedPrice: { type: "number" },
      floorPrice: { type: "number" },
      premiumPrice: { type: "number" },
      marginRate: { type: "number" },
      rationale: { type: "string" },
      promoNotes: { type: "string" }
    }),
    packagingBrief: objectSchema({
      concept: { type: "string" },
      visualDirection: { type: "string" },
      materials: { type: "string" },
      requiredElements: stringArraySchema(),
      complianceNotes: stringArraySchema()
    }),
    frontPackagingCopy: { type: "string" },
    backPackagingCopy: { type: "string" },
    productTitle: { type: "string" },
    shortDescription: { type: "string" },
    longDescription: { type: "string" },
    seoKeywords: stringArraySchema(),
    socialPosts: {
      type: "array",
      minItems: 1,
      items: objectSchema({
        platform: { type: "string", enum: ["IG", "Threads", "TikTok"] },
        caption: { type: "string" },
        hashtags: stringArraySchema(),
        cta: { type: "string" }
      })
    },
    videoScripts: {
      type: "array",
      minItems: 1,
      items: objectSchema({
        title: { type: "string" },
        durationSeconds: { type: "number" },
        hook: { type: "string" },
        scenes: stringArraySchema(),
        cta: { type: "string" }
      })
    },
    faqs: arrayOfObject({
      question: { type: "string" },
      answer: { type: "string" }
    }),
    customerServiceScripts: arrayOfObject({
      scenario: { type: "string" },
      response: { type: "string" }
    }),
    launchChecklist: arrayOfObject({
      phase: { type: "string" },
      task: { type: "string" },
      ownerHint: { type: "string" }
    }),
    firstMonthMarketingPlan: {
      type: "array",
      minItems: 1,
      items: objectSchema({
        week: { type: "string" },
        focus: { type: "string" },
        actions: stringArraySchema(),
        metric: { type: "string" }
      })
    },
    optimizationSuggestions: arrayOfObject({
      signal: { type: "string" },
      action: { type: "string" },
      why: { type: "string" }
    })
  }
} as const;

export const LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION = `
請輸出一個 LaunchReport JSON object，欄位必須完整包含：
- productName, category, generatedAt, isMock
- positioning, targetAudienceAnalysis, keySellingPoints
- competitorAnalysis, pricingStrategy, packagingBrief
- frontPackagingCopy, backPackagingCopy
- productTitle, shortDescription, longDescription
- seoKeywords, socialPosts, videoScripts
- faqs, customerServiceScripts, launchChecklist
- firstMonthMarketingPlan, optimizationSuggestions

陣列不可為空。socialPosts 至少包含 IG、Threads、TikTok 三種平台。generatedAt 使用 ISO-8601 字串。isMock 必須為 false。
`.trim();

export function buildProductLaunchUserPrompt(input: LaunchReportInput) {
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
7. 若商品涉及食品、美妝、保健、醫療、香氛或可能接觸身體，請加入人工審核與法規風險提醒。
8. 不得使用「保證有效」「治療」「改善疾病」「醫療功效」「保證銷售」「月收保證」等宣稱。

${LAUNCH_REPORT_JSON_SCHEMA_INSTRUCTION}
`.trim();
}

function stringArraySchema() {
  return {
    type: "array",
    minItems: 1,
    items: { type: "string" }
  } as const;
}

function objectSchema(properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    required: Object.keys(properties),
    properties
  } as const;
}

function arrayOfObject(properties: Record<string, unknown>) {
  return {
    type: "array",
    minItems: 1,
    items: objectSchema(properties)
  } as const;
}
