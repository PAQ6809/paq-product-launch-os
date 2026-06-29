function nonEmptyString() {
  return { type: "string", minLength: 1 } as const;
}

function stringArraySchema() {
  return {
    type: "array",
    minItems: 1,
    items: nonEmptyString()
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

export const LAUNCH_REPORT_REQUIRED_FIELDS = [
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
  "optimizationSuggestions",
  "legalRiskNotes"
] as const;

export const LAUNCH_REPORT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: LAUNCH_REPORT_REQUIRED_FIELDS,
  properties: {
    productName: nonEmptyString(),
    category: nonEmptyString(),
    generatedAt: nonEmptyString(),
    isMock: { type: "boolean" },
    positioning: nonEmptyString(),
    targetAudienceAnalysis: nonEmptyString(),
    keySellingPoints: stringArraySchema(),
    competitorAnalysis: arrayOfObject({
      name: nonEmptyString(),
      positioning: nonEmptyString(),
      priceRange: nonEmptyString(),
      strength: nonEmptyString(),
      gap: nonEmptyString()
    }),
    pricingStrategy: objectSchema({
      suggestedPrice: { type: "number" },
      floorPrice: { type: "number" },
      premiumPrice: { type: "number" },
      marginRate: { type: "number" },
      rationale: nonEmptyString(),
      promoNotes: nonEmptyString()
    }),
    packagingBrief: objectSchema({
      concept: nonEmptyString(),
      visualDirection: nonEmptyString(),
      materials: nonEmptyString(),
      requiredElements: stringArraySchema(),
      complianceNotes: stringArraySchema()
    }),
    frontPackagingCopy: nonEmptyString(),
    backPackagingCopy: nonEmptyString(),
    productTitle: nonEmptyString(),
    shortDescription: nonEmptyString(),
    longDescription: nonEmptyString(),
    seoKeywords: stringArraySchema(),
    socialPosts: {
      type: "array",
      minItems: 1,
      items: objectSchema({
        platform: { type: "string", enum: ["IG", "Threads", "TikTok"] },
        caption: nonEmptyString(),
        hashtags: stringArraySchema(),
        cta: nonEmptyString()
      })
    },
    videoScripts: {
      type: "array",
      minItems: 1,
      items: objectSchema({
        title: nonEmptyString(),
        durationSeconds: { type: "number" },
        hook: nonEmptyString(),
        scenes: stringArraySchema(),
        cta: nonEmptyString()
      })
    },
    faqs: arrayOfObject({
      question: nonEmptyString(),
      answer: nonEmptyString()
    }),
    customerServiceScripts: arrayOfObject({
      scenario: nonEmptyString(),
      response: nonEmptyString()
    }),
    launchChecklist: arrayOfObject({
      phase: nonEmptyString(),
      task: nonEmptyString(),
      ownerHint: nonEmptyString()
    }),
    firstMonthMarketingPlan: {
      type: "array",
      minItems: 1,
      items: objectSchema({
        week: nonEmptyString(),
        focus: nonEmptyString(),
        actions: stringArraySchema(),
        metric: nonEmptyString()
      })
    },
    optimizationSuggestions: arrayOfObject({
      signal: nonEmptyString(),
      action: nonEmptyString(),
      why: nonEmptyString()
    }),
    legalRiskNotes: stringArraySchema()
  }
} as const;
