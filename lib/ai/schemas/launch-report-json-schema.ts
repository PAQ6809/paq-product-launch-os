function nonEmptyString() {
  return { type: "string", minLength: 1 } as const;
}

function stringArraySchema(minItems = 1) {
  return {
    type: "array",
    minItems,
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

function arrayOfObject(properties: Record<string, unknown>, minItems = 1) {
  return {
    type: "array",
    minItems,
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
  "legalRiskNotes",
  "analysis",
  "metadata"
] as const;

const realAnalysisSchema = objectSchema({
  executiveSummary: objectSchema({
    summary: nonEmptyString(),
    keyOpportunities: stringArraySchema(),
    keyRisks: stringArraySchema(),
    strongestAngle: nonEmptyString(),
    weakestPoint: nonEmptyString()
  }),
  productDiagnosis: objectSchema({
    insight: nonEmptyString(),
    reasoning: nonEmptyString(),
    assumptions: stringArraySchema(),
    missingInformation: stringArraySchema(0),
    recommendations: stringArraySchema()
  }),
  positioningAnalysis: objectSchema({
    primaryPositioning: nonEmptyString(),
    alternativePositioning: nonEmptyString(),
    whyThisWorks: nonEmptyString(),
    whoItIsNotFor: nonEmptyString(),
    risks: stringArraySchema()
  }),
  targetAudience: objectSchema({
    primarySegment: nonEmptyString(),
    secondarySegment: nonEmptyString(),
    painPoints: stringArraySchema(),
    buyingTriggers: stringArraySchema(),
    objections: stringArraySchema(),
    messagingAngle: nonEmptyString()
  }),
  competitiveStrategy: objectSchema({
    likelyCompetitors: stringArraySchema(),
    differentiation: stringArraySchema(),
    defensibility: nonEmptyString(),
    comparisonTable: arrayOfObject({
      factor: nonEmptyString(),
      paqProduct: nonEmptyString(),
      competitorPattern: nonEmptyString(),
      opportunity: nonEmptyString()
    }),
    risks: stringArraySchema()
  }),
  pricingAnalysis: objectSchema({
    suggestedPriceRange: nonEmptyString(),
    reasoning: nonEmptyString(),
    marginNotes: nonEmptyString(),
    discountStrategy: nonEmptyString(),
    riskNotes: stringArraySchema()
  }),
  packagingStrategy: objectSchema({
    packagingConcept: nonEmptyString(),
    visualDirection: nonEmptyString(),
    copyDirection: nonEmptyString(),
    unboxingMoment: nonEmptyString(),
    costRisk: nonEmptyString()
  }),
  listingCopy: objectSchema({
    title: nonEmptyString(),
    subtitle: nonEmptyString(),
    bullets: stringArraySchema(),
    description: nonEmptyString(),
    seoKeywords: stringArraySchema(),
    complianceWarnings: stringArraySchema()
  }),
  marketingPlan: objectSchema({
    first7Days: stringArraySchema(),
    first30Days: stringArraySchema(),
    channelStrategy: nonEmptyString(),
    contentThemes: stringArraySchema(),
    launchChecklist: stringArraySchema()
  }),
  socialContent: objectSchema({
    posts: stringArraySchema(),
    shortVideoScripts: stringArraySchema(),
    creatorBrief: nonEmptyString()
  }),
  customerSupport: objectSchema({
    faq: stringArraySchema(),
    objectionHandling: stringArraySchema(),
    replyScripts: stringArraySchema()
  }),
  legalRiskAssessment: objectSchema({
    riskyClaims: stringArraySchema(),
    saferAlternatives: stringArraySchema(),
    requiredDisclaimers: stringArraySchema(),
    reviewNeeded: { type: "boolean" }
  }),
  nextActions: arrayOfObject({
    priority: { type: "string", enum: ["high", "medium", "low"] },
    action: nonEmptyString(),
    reason: nonEmptyString(),
    expectedImpact: nonEmptyString(),
    effort: nonEmptyString()
  })
});

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
    legalRiskNotes: stringArraySchema(),
    analysis: realAnalysisSchema,
    metadata: objectSchema({
      provider: { type: "string", enum: ["mock", "openai", "nvidia"] },
      model: nonEmptyString(),
      isAiGenerated: { type: "boolean" },
      isFallback: { type: "boolean" },
      generatedAt: nonEmptyString(),
      assumptionsUsed: stringArraySchema(),
      confidenceLevel: { type: "string", enum: ["low", "medium", "high"] },
      validationPassed: { type: "boolean" },
      warnings: stringArraySchema(0)
    })
  }
} as const;
