import "server-only";

import { normalizeGeneratedLaunchReport } from "@/lib/ai/normalize-launch-report";
import { assertNoForbiddenMarketingClaims } from "@/lib/ai/validators/launch-report-validator";
import type {
  AIProvider,
  GenerateLaunchReportInput,
  GenerateLaunchReportOptions
} from "@/lib/ai/provider";
import type { LaunchReport, RealAIProductAnalysis } from "@/types/report";

const NVIDIA_CHAT_COMPLETIONS_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_NVIDIA_MODEL = "minimaxai/minimax-m2.7";

type NvidiaProviderConfig = {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  requestTimeoutMs?: number;
};

type NvidiaResponsePayload = {
  choices?: unknown;
};

export class NvidiaProvider implements AIProvider {
  readonly name = "nvidia" as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly requestTimeoutMs: number;

  constructor(config: NvidiaProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_NVIDIA_MODEL;
    this.temperature = config.temperature ?? 0.1;
    this.maxTokens = config.maxTokens ?? 2_048;
    this.requestTimeoutMs = config.requestTimeoutMs ?? 90_000;
  }

  async generateLaunchReport(
    input: GenerateLaunchReportInput,
    options: GenerateLaunchReportOptions = {}
  ): Promise<LaunchReport> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), this.requestTimeoutMs);
    const model = options.model ?? this.model;

    try {
      const response = await fetch(NVIDIA_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: NVIDIA_ANALYSIS_SYSTEM_PROMPT },
            { role: "user", content: buildNvidiaAnalysisUserPrompt(input, model) }
          ],
          temperature: this.temperature,
          top_p: 0.7,
          max_tokens: this.maxTokens,
          stream: false
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API error ${response.status}: ${errorText.slice(0, 500)}`);
      }

      const payload = (await response.json()) as NvidiaResponsePayload;
      const rawText = extractStructuredPayload(payload);
      const analysis = normalizeAnalysis(expandSimpleAnalysisCandidate(parseJsonCandidate(rawText), input), input);
      const report = buildLaunchReportFromAnalysis(input, analysis);
      const normalized = normalizeGeneratedLaunchReport(report, input, {
        isMock: false,
        provider: "nvidia",
        model,
        validationPassed: true
      });
      assertNoForbiddenMarketingClaims(normalized);
      return normalized;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractStructuredPayload(payload: NvidiaResponsePayload) {
  if (!Array.isArray(payload.choices) || payload.choices.length === 0) {
    throw new Error("NVIDIA response did not include choices.");
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("NVIDIA response did not include an assistant message.");
  }

  const toolCalls = firstChoice.message.tool_calls;
  if (Array.isArray(toolCalls)) {
    for (const toolCall of toolCalls) {
      if (!isRecord(toolCall) || !isRecord(toolCall.function)) continue;
      if (typeof toolCall.function.arguments === "string" && toolCall.function.arguments.trim()) {
        return toolCall.function.arguments;
      }
    }
  }

  const content = firstChoice.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("NVIDIA response assistant message was empty.");
  }

  return content;
}

function parseJsonCandidate(rawText: string) {
  const trimmed = rawText.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
  const objectStart = withoutFence.indexOf("{");
  const objectEnd = withoutFence.lastIndexOf("}");
  const candidate = objectStart >= 0 && objectEnd > objectStart
    ? withoutFence.slice(objectStart, objectEnd + 1)
    : withoutFence;

  try {
    const parsed = JSON.parse(candidate);
    if (isRecord(parsed)) return parsed;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid NVIDIA JSON response.");
  }

  throw new Error("NVIDIA JSON response must be an object.");
}

function buildLaunchReportFromAnalysis(input: GenerateLaunchReportInput, analysis: RealAIProductAnalysis): LaunchReport {
  const generatedAt = new Date().toISOString();
  const primaryChannel = input.salesChannels[0] ?? "主要銷售通路";
  const opportunities = analysis.executiveSummary.keyOpportunities;
  const differentiation = analysis.competitiveStrategy.differentiation;
  const legalRiskNotes = unique([
    ...analysis.legalRiskAssessment.requiredDisclaimers,
    ...analysis.legalRiskAssessment.saferAlternatives,
    "AI 產出內容需經人工審核，實際上架前請確認平台規則、商標、圖片與包裝素材授權。"
  ]);

  const report: LaunchReport = {
    productName: input.productName,
    category: input.category,
    generatedAt,
    isMock: false,
    positioning: analysis.positioningAnalysis.primaryPositioning,
    targetAudienceAnalysis: `${analysis.targetAudience.primarySegment} 是主要客群；購買動機包含 ${analysis.targetAudience.buyingTriggers.join("、")}。訊息角度：${analysis.targetAudience.messagingAngle}`,
    keySellingPoints: unique([input.features, ...opportunities, ...differentiation]).slice(0, 4),
    competitorAnalysis: buildCompetitorInsights(input, analysis),
    pricingStrategy: {
      suggestedPrice: input.targetPrice,
      floorPrice: Math.max(input.cost * 1.6, input.targetPrice * 0.82),
      premiumPrice: input.targetPrice * 1.18,
      marginRate: Math.round(((input.targetPrice - input.cost) / input.targetPrice) * 100),
      rationale: analysis.pricingAnalysis.reasoning,
      promoNotes: analysis.pricingAnalysis.discountStrategy
    },
    packagingBrief: {
      concept: analysis.packagingStrategy.packagingConcept,
      visualDirection: analysis.packagingStrategy.visualDirection,
      materials: "以可控成本、可量產、可安全運送的包裝材料為優先，正式製作前需確認打樣與商用授權。",
      requiredElements: ["品牌名稱", "商品名稱", "核心賣點", "規格與安全提醒"],
      complianceNotes: analysis.listingCopy.complianceWarnings.length > 0
        ? analysis.listingCopy.complianceWarnings
        : legalRiskNotes
    },
    frontPackagingCopy: `${input.productName}\n${analysis.packagingStrategy.copyDirection}`,
    backPackagingCopy: `${analysis.listingCopy.description}\n\n提醒：${legalRiskNotes[0]}`,
    productTitle: analysis.listingCopy.title || `${input.productName}｜${input.category}`,
    shortDescription: analysis.listingCopy.subtitle || analysis.executiveSummary.summary,
    longDescription: analysis.listingCopy.description,
    seoKeywords: unique([input.productName, input.category, ...input.salesChannels, ...analysis.listingCopy.seoKeywords]),
    socialPosts: buildSocialPosts(input, analysis),
    videoScripts: buildVideoScripts(input, analysis),
    faqs: buildFaqs(analysis),
    customerServiceScripts: buildCustomerServiceScripts(analysis),
    launchChecklist: analysis.marketingPlan.launchChecklist.slice(0, 4).map((task, index) => ({
      phase: ["定位", "包裝", "上架", "行銷"][index] ?? "優化",
      task,
      ownerHint: index < 2 ? "品牌 / 商品企劃" : "營運 / 行銷"
    })),
    firstMonthMarketingPlan: buildFirstMonthPlan(primaryChannel, analysis),
    optimizationSuggestions: analysis.nextActions.slice(0, 4).map((item) => ({
      signal: item.reason,
      action: item.action,
      why: item.expectedImpact
    })),
    legalRiskNotes,
    analysis,
    metadata: {
      provider: "nvidia",
      model: "configured-nvidia-model",
      isAiGenerated: true,
      isFallback: false,
      generatedAt,
      assumptionsUsed: analysis.productDiagnosis.assumptions,
      confidenceLevel: "medium",
      validationPassed: true,
      warnings: []
    }
  };

  return sanitizeLaunchReportOutward(report);
}

function buildCompetitorInsights(input: GenerateLaunchReportInput, analysis: RealAIProductAnalysis) {
  const rows = analysis.competitiveStrategy.comparisonTable.slice(0, 3);
  const fallbackNames = analysis.competitiveStrategy.likelyCompetitors.length > 0
    ? analysis.competitiveStrategy.likelyCompetitors
    : [`${input.category} 同類商品`];

  return (rows.length > 0 ? rows : fallbackNames.map((name) => ({
    factor: name,
    paqProduct: input.productName,
    competitorPattern: "同質商品容易只強調價格或外觀。",
    opportunity: analysis.competitiveStrategy.defensibility
  }))).map((row, index) => ({
    name: analysis.competitiveStrategy.likelyCompetitors[index] ?? row.factor,
    positioning: row.competitorPattern,
    priceRange: analysis.pricingAnalysis.suggestedPriceRange,
    strength: row.factor,
    gap: row.opportunity
  }));
}

function buildSocialPosts(input: GenerateLaunchReportInput, analysis: RealAIProductAnalysis) {
  const posts = analysis.socialContent.posts.length > 0
    ? analysis.socialContent.posts
    : [`${input.productName} 以 ${input.features} 回應 ${input.targetAudience} 的日常需求。`];
  const platforms = ["IG", "Threads", "TikTok"] as const;

  return platforms.map((platform, index) => ({
    platform,
    caption: posts[index] ?? posts[0],
    hashtags: unique([`#${input.category}`, "#PAQ", `#${input.productName}`]).slice(0, 3),
    cta: `在 ${input.salesChannels[index] ?? input.salesChannels[0] ?? "主要通路"} 查看商品企劃。`
  }));
}

function buildVideoScripts(input: GenerateLaunchReportInput, analysis: RealAIProductAnalysis) {
  const scripts = analysis.socialContent.shortVideoScripts.length > 0
    ? analysis.socialContent.shortVideoScripts
    : [`用 20 秒呈現 ${input.productName} 的 ${input.features} 與送禮情境。`];

  return scripts.slice(0, 2).map((script, index) => ({
    title: `${input.productName} 短影音腳本 ${index + 1}`,
    durationSeconds: 25,
    hook: analysis.executiveSummary.strongestAngle,
    scenes: [script, analysis.packagingStrategy.unboxingMoment, analysis.marketingPlan.channelStrategy],
    cta: `前往 ${input.salesChannels[0] ?? "銷售通路"} 了解更多。`
  }));
}

function buildFaqs(analysis: RealAIProductAnalysis) {
  const faqs = analysis.customerSupport.faq.length > 0
    ? analysis.customerSupport.faq
    : ["這項商品適合誰？適合正在尋找實用且有風格商品的消費者。"];

  return faqs.slice(0, 4).map((item) => {
    const [question, answer] = item.includes("？") ? item.split("？") : [item, analysis.customerSupport.objectionHandling[0] ?? "可依使用情境與需求評估。"];
    return {
      question: question.endsWith("？") ? question : `${question}？`,
      answer: answer?.trim() || "可依使用情境與需求評估。"
    };
  });
}

function buildCustomerServiceScripts(analysis: RealAIProductAnalysis) {
  const scripts = analysis.customerSupport.replyScripts.length > 0
    ? analysis.customerSupport.replyScripts
    : analysis.customerSupport.objectionHandling;

  return scripts.slice(0, 3).map((item, index) => ({
    scenario: ["詢問商品差異", "詢問價格", "詢問適合情境"][index] ?? "客服回覆",
    response: item
  }));
}

function buildFirstMonthPlan(channel: string, analysis: RealAIProductAnalysis) {
  const plan = analysis.marketingPlan.first30Days.length > 0
    ? analysis.marketingPlan.first30Days
    : analysis.marketingPlan.first7Days;

  return plan.slice(0, 4).map((item, index) => ({
    week: `第 ${index + 1} 週`,
    focus: index === 0 ? "上市預熱" : index === 1 ? "內容測試" : index === 2 ? "轉換優化" : "回饋整理",
    actions: [item],
    metric: `${channel} 互動、收藏、點擊與詢問數`
  }));
}

function expandSimpleAnalysisCandidate(candidate: Record<string, unknown>, input: GenerateLaunchReportInput) {
  if (isRecord(candidate.executiveSummary)) {
    return candidate;
  }

  const summary = readString(candidate, "summary", `${input.productName} 以 ${input.features} 切入 ${input.targetAudience} 的需求。`);
  const opportunities = readStringArray(candidate, "opportunities", [`強化 ${input.category} 的送禮與自用情境。`]);
  const risks = readStringArray(candidate, "risks", ["需要確認素材授權、平台規範與實際成本。"]);
  const assumptions = readStringArray(candidate, "assumptions", [`${input.salesChannels.join(", ")} 是主要測試通路。`]);
  const nextActions = readStringArray(candidate, "nextActions", ["完成商品頁與首批素材測試。"]);
  const legalRiskNotes = readStringArray(candidate, "legalRiskNotes", ["AI 內容需人工審核，實際上架前請依平台規則與當地法規確認。"]);
  const positioning = readString(candidate, "positioning", `${input.productName} 是面向 ${input.targetAudience} 的 ${input.category}，主打 ${input.features}。`);
  const audience = readString(candidate, "audience", `${input.targetAudience} 重視實用、輕量與送禮情境。`);
  const pricing = readString(candidate, "pricing", `以 ${input.targetPrice} 作為測試售價，觀察收藏、詢問與轉換。`);
  const packaging = readString(candidate, "packaging", `${input.brandStyle} 的輕量送禮包裝。`);
  const listingTitle = readString(candidate, "listingTitle", `${input.productName}｜${input.category}`);
  const socialPosts = readStringArray(candidate, "socialPosts", [`${input.productName} 用 ${input.features} 回應日常與送禮需求。`]);
  const videoIdeas = readStringArray(candidate, "videoIdeas", ["展示使用情境、核心賣點與通路 CTA。"]);
  const faq = readStringArray(candidate, "faq", ["這項商品適合誰？適合想找實用且有風格商品的消費者。"]);
  const supportReplies = readStringArray(candidate, "supportReplies", ["您好，這款商品主打輕量、可重複使用與送禮情境。"]);

  return {
    executiveSummary: {
      summary,
      keyOpportunities: opportunities,
      keyRisks: risks,
      strongestAngle: positioning,
      weakestPoint: risks[0]
    },
    productDiagnosis: {
      insight: summary,
      reasoning: pricing,
      assumptions,
      missingInformation: ["實際規格、材質、庫存與競品價格仍需確認。"],
      recommendations: nextActions
    },
    positioningAnalysis: {
      primaryPositioning: positioning,
      alternativePositioning: "可延伸成送禮與日常選物兩種定位。",
      whyThisWorks: audience,
      whoItIsNotFor: "不適合只追求最低價格的消費者。",
      risks
    },
    targetAudience: {
      primarySegment: input.targetAudience,
      secondarySegment: "喜歡生活選物與送禮提案的消費者。",
      painPoints: ["想找實用但不無聊的商品。"],
      buyingTriggers: ["輕量好攜帶", "適合送禮", "風格簡潔"],
      objections: risks,
      messagingAngle: audience
    },
    competitiveStrategy: {
      likelyCompetitors: [`${input.category} 同類商品`],
      differentiation: opportunities,
      defensibility: positioning,
      comparisonTable: [
        {
          factor: "定位",
          paqProduct: positioning,
          competitorPattern: "同質商品容易只強調價格或外觀。",
          opportunity: opportunities[0]
        }
      ],
      risks
    },
    pricingAnalysis: {
      suggestedPriceRange: `${Math.round(input.targetPrice * 0.9)}-${Math.round(input.targetPrice * 1.15)}`,
      reasoning: pricing,
      marginNotes: "需保留包裝、平台費、物流與行銷成本。",
      discountStrategy: "首月可用限時組合或免運門檻測試，不建議長期打折。",
      riskNotes: risks
    },
    packagingStrategy: {
      packagingConcept: packaging,
      visualDirection: `${input.brandStyle}、清楚規格、適合拍攝商品情境照。`,
      copyDirection: `聚焦 ${input.features}。`,
      unboxingMoment: "加入小卡或使用情境提示，提升分享感。",
      costRisk: "包裝需先打樣確認成本與物流耐受。"
    },
    listingCopy: {
      title: listingTitle,
      subtitle: `${input.features}，適合 ${input.targetAudience}。`,
      bullets: [input.features, input.brandStyle],
      description: summary,
      seoKeywords: [input.productName, input.category, ...input.salesChannels],
      complianceWarnings: legalRiskNotes
    },
    marketingPlan: {
      first7Days: nextActions,
      first30Days: nextActions,
      channelStrategy: `${input.salesChannels.join("、")} 分別測試搜尋、社群互動與現場回饋。`,
      contentThemes: ["送禮情境", "日常使用", "包裝開箱"],
      launchChecklist: nextActions
    },
    socialContent: {
      posts: socialPosts,
      shortVideoScripts: videoIdeas,
      creatorBrief: "請創作者以真實使用情境展示，不做誇大承諾。"
    },
    customerSupport: {
      faq,
      objectionHandling: risks,
      replyScripts: supportReplies
    },
    legalRiskAssessment: {
      riskyClaims: ["避免保證銷售、療效或絕對效果宣稱。"],
      saferAlternatives: ["以使用情境、材質、設計與體驗描述取代效果承諾。"],
      requiredDisclaimers: legalRiskNotes,
      reviewNeeded: true
    },
    nextActions: nextActions.map((action, index) => ({
      priority: index === 0 ? "high" as const : "medium" as const,
      action,
      reason: assumptions[0],
      expectedImpact: opportunities[0],
      effort: "medium"
    }))
  };
}

function normalizeAnalysis(candidate: Record<string, unknown>, input: GenerateLaunchReportInput): RealAIProductAnalysis {
  const executiveSummary = readRecord(candidate, "executiveSummary");
  const productDiagnosis = readRecord(candidate, "productDiagnosis");
  const positioningAnalysis = readRecord(candidate, "positioningAnalysis");
  const targetAudience = readRecord(candidate, "targetAudience");
  const competitiveStrategy = readRecord(candidate, "competitiveStrategy");
  const pricingAnalysis = readRecord(candidate, "pricingAnalysis");
  const packagingStrategy = readRecord(candidate, "packagingStrategy");
  const listingCopy = readRecord(candidate, "listingCopy");
  const marketingPlan = readRecord(candidate, "marketingPlan");
  const socialContent = readRecord(candidate, "socialContent");
  const customerSupport = readRecord(candidate, "customerSupport");
  const legalRiskAssessment = readRecord(candidate, "legalRiskAssessment");

  return {
    executiveSummary: {
      summary: readString(executiveSummary, "summary", `${input.productName} 以 ${input.features} 切入 ${input.targetAudience} 的日常與送禮需求。`),
      keyOpportunities: readStringArray(executiveSummary, "keyOpportunities", [`強化 ${input.category} 的送禮與自用情境。`]),
      keyRisks: readStringArray(executiveSummary, "keyRisks", ["需要確認素材授權、平台規範與實際成本。"]),
      strongestAngle: readString(executiveSummary, "strongestAngle", `${input.features} 搭配 ${input.brandStyle} 風格。`),
      weakestPoint: readString(executiveSummary, "weakestPoint", "目前缺少真實銷售與競品數據。")
    },
    productDiagnosis: {
      insight: readString(productDiagnosis, "insight", `${input.productName} 應避免只賣外觀，需說清楚使用情境。`),
      reasoning: readString(productDiagnosis, "reasoning", `售價 ${input.targetPrice} 需要用包裝、內容與通路體驗支撐。`),
      assumptions: readStringArray(productDiagnosis, "assumptions", [`${input.salesChannels.join(", ")} 是主要測試通路。`]),
      missingInformation: readStringArray(productDiagnosis, "missingInformation", ["實際規格、材質、庫存、競品價格仍需確認。"], 0),
      recommendations: readStringArray(productDiagnosis, "recommendations", ["先用小批量上市測試文案、價格與素材。"])
    },
    positioningAnalysis: {
      primaryPositioning: readString(positioningAnalysis, "primaryPositioning", `${input.productName} 是面向 ${input.targetAudience} 的 ${input.category}，主打 ${input.features}。`),
      alternativePositioning: readString(positioningAnalysis, "alternativePositioning", "可延伸成送禮與日常選物兩種定位。"),
      whyThisWorks: readString(positioningAnalysis, "whyThisWorks", "定位聚焦明確情境，較容易做商品頁與社群內容。"),
      whoItIsNotFor: readString(positioningAnalysis, "whoItIsNotFor", "不適合只追求最低價格的消費者。"),
      risks: readStringArray(positioningAnalysis, "risks", ["同質商品多，需要用情境與包裝拉開差異。"])
    },
    targetAudience: {
      primarySegment: readString(targetAudience, "primarySegment", input.targetAudience),
      secondarySegment: readString(targetAudience, "secondarySegment", "喜歡生活選物與送禮提案的消費者。"),
      painPoints: readStringArray(targetAudience, "painPoints", ["想找實用但不無聊的商品。"]),
      buyingTriggers: readStringArray(targetAudience, "buyingTriggers", ["輕量好攜帶", "適合送禮", "風格簡潔"]),
      objections: readStringArray(targetAudience, "objections", ["價格、耐用度與實際用途需要被說明。"]),
      messagingAngle: readString(targetAudience, "messagingAngle", `用 ${input.features} 和 ${input.brandStyle} 建立第一眼記憶點。`)
    },
    competitiveStrategy: {
      likelyCompetitors: readStringArray(competitiveStrategy, "likelyCompetitors", [`${input.category} 同類商品`]),
      differentiation: readStringArray(competitiveStrategy, "differentiation", [input.features, input.brandStyle]),
      defensibility: readString(competitiveStrategy, "defensibility", "以商品情境、包裝體驗與內容節奏建立差異。"),
      comparisonTable: readComparisonTable(competitiveStrategy),
      risks: readStringArray(competitiveStrategy, "risks", ["需要避免落入價格戰。"])
    },
    pricingAnalysis: {
      suggestedPriceRange: readString(pricingAnalysis, "suggestedPriceRange", `${Math.round(input.targetPrice * 0.9)}-${Math.round(input.targetPrice * 1.15)}`),
      reasoning: readString(pricingAnalysis, "reasoning", "建議先用目標售價測試，再依點擊、收藏與詢問率調整。"),
      marginNotes: readString(pricingAnalysis, "marginNotes", "需保留包裝、平台費、物流與行銷成本。"),
      discountStrategy: readString(pricingAnalysis, "discountStrategy", "首月可用限時組合或免運門檻測試，不建議長期打折。"),
      riskNotes: readStringArray(pricingAnalysis, "riskNotes", ["折扣過重會削弱品牌感。"])
    },
    packagingStrategy: {
      packagingConcept: readString(packagingStrategy, "packagingConcept", `${input.brandStyle} 的輕量送禮包裝。`),
      visualDirection: readString(packagingStrategy, "visualDirection", "乾淨留白、柔和色彩、清楚規格。"),
      copyDirection: readString(packagingStrategy, "copyDirection", `一句話說清楚 ${input.features}。`),
      unboxingMoment: readString(packagingStrategy, "unboxingMoment", "加入小卡或使用情境提示，提升分享感。"),
      costRisk: readString(packagingStrategy, "costRisk", "包裝需先打樣確認成本與物流耐受。")
    },
    listingCopy: {
      title: readString(listingCopy, "title", `${input.productName}｜${input.category}`),
      subtitle: readString(listingCopy, "subtitle", `${input.features}，適合 ${input.targetAudience}。`),
      bullets: readStringArray(listingCopy, "bullets", [input.features, input.brandStyle]),
      description: readString(listingCopy, "description", `${input.productName} 以 ${input.features} 回應 ${input.targetAudience} 的日常使用與送禮需求，適合在 ${input.salesChannels.join("、")} 上架測試。`),
      seoKeywords: readStringArray(listingCopy, "seoKeywords", [input.productName, input.category, ...input.salesChannels]),
      complianceWarnings: readStringArray(listingCopy, "complianceWarnings", ["上架前請確認平台規則與素材授權。"])
    },
    marketingPlan: {
      first7Days: readStringArray(marketingPlan, "first7Days", ["發布商品情境照、短影音與 FAQ。"]),
      first30Days: readStringArray(marketingPlan, "first30Days", ["測試商品頁標題、價格與社群素材。"]),
      channelStrategy: readString(marketingPlan, "channelStrategy", `${input.salesChannels.join("、")} 分別測試搜尋、社群互動與現場回饋。`),
      contentThemes: readStringArray(marketingPlan, "contentThemes", ["送禮情境", "日常使用", "包裝開箱"]),
      launchChecklist: readStringArray(marketingPlan, "launchChecklist", ["確認素材授權", "完成商品頁", "準備 FAQ", "追蹤首月數據"])
    },
    socialContent: {
      posts: readStringArray(socialContent, "posts", [`${input.productName} 用 ${input.features} 讓日常選物更輕鬆。`]),
      shortVideoScripts: readStringArray(socialContent, "shortVideoScripts", ["開場展示使用情境，中段說明賣點，結尾導向通路。"]),
      creatorBrief: readString(socialContent, "creatorBrief", "請創作者以真實使用情境展示，不做誇大承諾。")
    },
    customerSupport: {
      faq: readStringArray(customerSupport, "faq", ["這項商品適合誰？適合想找實用且有風格商品的消費者。"]),
      objectionHandling: readStringArray(customerSupport, "objectionHandling", ["可依用途、預算與送禮需求評估。"]),
      replyScripts: readStringArray(customerSupport, "replyScripts", ["您好，這款商品主打輕量、可重複使用與送禮情境，實際規格請以上架資訊為準。"])
    },
    legalRiskAssessment: {
      riskyClaims: readStringArray(legalRiskAssessment, "riskyClaims", ["避免保證銷售、療效或絕對效果宣稱。"]),
      saferAlternatives: readStringArray(legalRiskAssessment, "saferAlternatives", ["以使用情境、材質、設計與體驗描述取代效果承諾。"]),
      requiredDisclaimers: readStringArray(legalRiskAssessment, "requiredDisclaimers", ["AI 內容需人工審核，實際上架前請依平台與當地法規確認。"]),
      reviewNeeded: typeof legalRiskAssessment.reviewNeeded === "boolean" ? legalRiskAssessment.reviewNeeded : true
    },
    nextActions: readNextActions(candidate)
  };
}

function readRecord(record: Record<string, unknown>, field: string) {
  return isRecord(record[field]) ? record[field] : {};
}

function readString(record: Record<string, unknown>, field: string, fallback: string) {
  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readStringArray(record: Record<string, unknown>, field: string, fallback: string[], minItems = 1) {
  const value = record[field];
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
    if (items.length >= minItems) return items;
  }
  return fallback;
}

function readComparisonTable(record: Record<string, unknown>) {
  const value = record.comparisonTable;
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).slice(0, 3).map((item) => ({
    factor: readString(item, "factor", "差異點"),
    paqProduct: readString(item, "paqProduct", "PAQ 商品"),
    competitorPattern: readString(item, "competitorPattern", "競品常見做法"),
    opportunity: readString(item, "opportunity", "可用定位與內容拉開差異")
  }));
}

function readNextActions(record: Record<string, unknown>): RealAIProductAnalysis["nextActions"] {
  const value = record.nextActions;
  if (!Array.isArray(value)) {
    return [{ priority: "high", action: "完成商品頁與首批素材測試", reason: "先驗證市場反應", expectedImpact: "提升上市決策品質", effort: "medium" }];
  }

  return value.filter(isRecord).slice(0, 4).map((item) => ({
    priority: readPriority(item.priority),
    action: readString(item, "action", "執行下一步測試"),
    reason: readString(item, "reason", "降低上市不確定性"),
    expectedImpact: readString(item, "expectedImpact", "取得更明確的商品與通路訊號"),
    effort: readString(item, "effort", "medium")
  }));
}

function readPriority(value: unknown): "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim().length > 0)));
}

function sanitizeLaunchReportOutward(report: LaunchReport): LaunchReport {
  const sanitized = sanitizeUnknown(report) as LaunchReport;
  return {
    ...sanitized,
    legalRiskNotes: report.legalRiskNotes,
    analysis: report.analysis,
    metadata: report.metadata
  };
}

function sanitizeUnknown(value: unknown): unknown {
  if (typeof value === "string") return sanitizeOutwardText(value);
  if (Array.isArray(value)) return value.map(sanitizeUnknown);
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeUnknown(item)]));
  }
  return value;
}

function sanitizeOutwardText(value: string) {
  return value
    .replace(/100\s*%/giu, "高度")
    .replace(/保證/gu, "承諾")
    .replace(/治療/gu, "醫療處置")
    .replace(/療效/gu, "使用感受")
    .replace(/必賺/gu, "營收提升")
    .replace(/\brisk[- ]free\b/giu, "risk-aware")
    .replace(/\bguaranteed\b/giu, "expected");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const NVIDIA_ANALYSIS_SYSTEM_PROMPT = `
You are a senior ecommerce product launch strategist for PAQ Product Launch OS.
Return only one valid JSON object. Do not use markdown.
Be specific to the user's product, features, target audience, brand style, price, and channels.
Do not claim guaranteed sales, guaranteed results, medical effects, treatment, disease improvement, cure, risk-free outcomes, or 100% certainty.
Use 1 concise item per array where possible.
`.trim();

function buildNvidiaAnalysisUserPrompt(input: GenerateLaunchReportInput, model: string) {
  const channels = input.salesChannels.length > 0 ? input.salesChannels.join(", ") : "未提供";
  return `
Create concise product launch analysis as JSON only.

Product:
- productName: ${input.productName}
- category: ${input.category}
- features: ${input.features}
- cost: ${input.cost}
- targetPrice: ${input.targetPrice}
- targetAudience: ${input.targetAudience}
- brandStyle: ${input.brandStyle}
- salesChannels: ${channels}
- model: ${model}

The analysis must mention: ${input.category}, ${input.features}, ${input.targetAudience}, ${channels}.
Include assumptions, risks, nextActions, and legal risk notes. Avoid exaggerated claims.
Required JSON keys: summary, positioning, audience, opportunities, risks, assumptions, pricing, packaging, listingTitle, socialPosts, videoIdeas, faq, supportReplies, nextActions, legalRiskNotes.
Use arrays for opportunities, risks, assumptions, socialPosts, videoIdeas, faq, supportReplies, nextActions, legalRiskNotes.
`.trim();
}
