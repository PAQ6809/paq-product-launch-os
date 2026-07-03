import type { AIProviderName, GenerateLaunchReportInput } from "@/lib/ai/provider";
import type { LaunchReport, LaunchReportMetadata, RealAIProductAnalysis } from "@/types/report";
import { formatCurrency, getMarginRate } from "@/lib/utils";

const REGULATED_CATEGORY_PATTERN = /食品|美妝|保健|醫療|藥|營養|香氛|精油|身體|肌膚|保養/iu;

const regulatedReminder =
  "此商品可能涉及食品、美妝、保健、醫療或身體感受相關風險。實際上架前需人工審核，避免療效、治療、改善疾病、臨床證明或保證效果等宣稱。";

type NormalizeGeneratedReportOptions = {
  isMock: boolean;
  provider?: AIProviderName;
  model?: string;
  isFallback?: boolean;
  validationPassed?: boolean;
  warnings?: string[];
};

export function normalizeGeneratedLaunchReport(
  report: LaunchReport,
  input: GenerateLaunchReportInput,
  options: NormalizeGeneratedReportOptions
): LaunchReport {
  const generatedAt = new Date().toISOString();
  const provider = options.provider ?? (options.isMock ? "mock" : "openai");
  const model = options.model ?? (options.isMock ? "paq-mock-v1" : "configured-model");
  const analysis = report.analysis ?? buildFallbackAnalysis(input);
  const warnings = Array.from(new Set([...(report.metadata?.warnings ?? []), ...(options.warnings ?? [])]));
  const metadata: LaunchReportMetadata = {
    provider,
    model,
    isAiGenerated: true,
    isFallback: options.isFallback ?? options.isMock,
    generatedAt,
    assumptionsUsed: analysis.productDiagnosis.assumptions,
    confidenceLevel: inferConfidenceLevel(analysis),
    validationPassed: options.validationPassed ?? true,
    warnings
  };

  const normalized: LaunchReport = {
    ...report,
    productName: input.productName,
    category: input.category,
    generatedAt,
    isMock: options.isMock,
    pricingStrategy: {
      ...report.pricingStrategy,
      suggestedPrice: Number(report.pricingStrategy.suggestedPrice) || input.targetPrice,
      marginRate: Number.isFinite(report.pricingStrategy.marginRate)
        ? report.pricingStrategy.marginRate
        : getMarginRate(input.cost, input.targetPrice)
    },
    legalRiskNotes: [...report.legalRiskNotes],
    analysis,
    metadata
  };

  const regulatedSource = `${input.category} ${input.features} ${input.productName}`;

  if (!REGULATED_CATEGORY_PATTERN.test(regulatedSource)) {
    return normalized;
  }

  return {
    ...normalized,
    packagingBrief: {
      ...normalized.packagingBrief,
      complianceNotes: Array.from(
        new Set([...normalized.packagingBrief.complianceNotes, regulatedReminder])
      )
    },
    legalRiskNotes: Array.from(new Set([...normalized.legalRiskNotes, regulatedReminder])),
    analysis: {
      ...analysis,
      legalRiskAssessment: {
        ...analysis.legalRiskAssessment,
        riskyClaims: Array.from(
          new Set([...analysis.legalRiskAssessment.riskyClaims, "療效、治療、改善疾病、保證效果"])
        ),
        saferAlternatives: Array.from(
          new Set([...analysis.legalRiskAssessment.saferAlternatives, "改以使用情境、香氣感受、材質與體驗描述取代效果承諾"])
        ),
        requiredDisclaimers: Array.from(
          new Set([...analysis.legalRiskAssessment.requiredDisclaimers, regulatedReminder])
        ),
        reviewNeeded: true
      }
    }
  };
}

export function buildFallbackAnalysis(input: GenerateLaunchReportInput): RealAIProductAnalysis {
  const channels = input.salesChannels.length > 0 ? input.salesChannels.join(", ") : "自有官網與社群";
  const margin = getMarginRate(input.cost, input.targetPrice);
  const priceRange = `${formatCurrency(Math.round(input.targetPrice * 0.9))} - ${formatCurrency(Math.round(input.targetPrice * 1.12))}`;
  const assumptions = [
    `以 ${channels} 作為第一波主要銷售通路`,
    `以 ${formatCurrency(input.targetPrice)} 作為上市主價格`,
    "尚未取得真實競品價格與廣告投放數據"
  ];

  return {
    executiveSummary: {
      summary: `${input.productName} 的上市重點是把「${input.features}」轉成 ${input.targetAudience} 能立即理解的購買理由，並用 ${channels} 先驗證需求。`,
      keyOpportunities: [
        `售價 ${formatCurrency(input.targetPrice)} 可搭配通路內容測試轉換`,
        `${input.brandStyle} 風格有機會形成包裝與社群的一致識別`,
        `${input.category} 可用情境式內容降低陌生商品的理解成本`
      ],
      keyRisks: [
        "競品資料仍是市場假設，需要上架前人工補查",
        "若包裝成本超出預估，毛利會被快速壓縮",
        "文案需避免保證成效或法規敏感宣稱"
      ],
      strongestAngle: `${input.features} 對 ${input.targetAudience} 的具體使用情境`,
      weakestPoint: "目前缺少真實競品價格、圖片授權與早期顧客回饋"
    },
    productDiagnosis: {
      insight: `${input.productName} 不應只賣功能，而要賣「為什麼這群人現在需要它」。`,
      reasoning: `成本 ${formatCurrency(input.cost)}、售價 ${formatCurrency(input.targetPrice)}、毛利約 ${margin}%；上市初期應優先驗證價格接受度與主賣點清晰度。`,
      assumptions,
      missingInformation: ["實際商品尺寸與材質", "競品真實售價", "物流與包材成本", "首批庫存量"],
      recommendations: [
        "先用一頁式商品頁測試主標題與三個核心賣點",
        "用短影音驗證第一眼 hook 是否能讓客群停留",
        "用 FAQ 收斂購買疑慮，再回填商品頁"
      ]
    },
    positioningAnalysis: {
      primaryPositioning: `${input.productName} 是為 ${input.targetAudience} 打造的 ${input.category}，主打 ${input.features}。`,
      alternativePositioning: `也可定位為具備 ${input.brandStyle} 風格的送禮 / 自用型商品。`,
      whyThisWorks: "定位同時連到商品功能、客群與銷售通路，方便後續拆成包裝、商品頁與社群內容。",
      whoItIsNotFor: "只追求最低價、或需要完整專業規格比較的買家。",
      risks: ["定位若太廣會降低記憶點", "若只談風格不談用途，轉換率可能偏弱"]
    },
    targetAudience: {
      primarySegment: input.targetAudience,
      secondarySegment: "受主要客群影響而產生送禮或自用需求的相近族群",
      painPoints: ["選擇成本高", "擔心商品與預期不符", "缺少足夠情境說明"],
      buyingTriggers: ["清楚的使用情境", "一致的品牌風格", "可被分享的包裝或內容"],
      objections: ["價格是否合理", "是否真的適合自己", "實物品質是否符合照片"],
      messagingAngle: `用「${input.features}」解釋為何它適合 ${input.targetAudience}。`
    },
    competitiveStrategy: {
      likelyCompetitors: [`平價 ${input.category}`, `設計感 ${input.category}`, "平台熱銷相近商品"],
      differentiation: [`更聚焦 ${input.targetAudience}`, `包裝與文案保持 ${input.brandStyle}`, "用 FAQ 與短影音降低購買疑慮"],
      defensibility: "第一版防守點不在技術門檻，而在定位、視覺、內容節奏與顧客回饋迭代。",
      comparisonTable: [
        { factor: "定位", paqProduct: input.targetAudience, competitorPattern: "多半訴求廣泛買家", opportunity: "用更窄的客群提升記憶點" },
        { factor: "價格", paqProduct: formatCurrency(input.targetPrice), competitorPattern: "可能以低價或套組競爭", opportunity: "用包裝與內容支撐價格" },
        { factor: "內容", paqProduct: input.features, competitorPattern: "常停在功能列表", opportunity: "用情境故事提高理解度" }
      ],
      risks: ["若競品低價促銷，需避免直接價格戰", "若缺少評價，初期信任感不足"]
    },
    pricingAnalysis: {
      suggestedPriceRange: priceRange,
      reasoning: `以成本 ${formatCurrency(input.cost)} 與目標售價 ${formatCurrency(input.targetPrice)} 推估，上市價可保留測試與促銷空間。`,
      marginNotes: `目前粗估毛利率約 ${margin}%，仍需扣除包材、金流、平台抽成、物流與退換貨成本。`,
      discountStrategy: "首月建議用限量贈品、免運門檻或套組，不要直接長期降價。",
      riskNotes: ["若平台抽成高，最低可接受價格需重算", "若包裝成本增加，應調整套組或售價"]
    },
    packagingStrategy: {
      packagingConcept: `${input.brandStyle} 的第一眼識別，讓客戶在開箱前理解 ${input.productName} 的定位。`,
      visualDirection: "保留品牌主色與清楚層級，正面只放最重要的品名與一句定位。",
      copyDirection: "正面短句建立期待，背面補足用途、規格、注意事項與審核提醒。",
      unboxingMoment: "加入一張小卡或 QR code，導向商品故事、使用方式或社群分享。",
      costRisk: "包材升級需先估算單件成本，避免毛利被視覺設計吃掉。"
    },
    listingCopy: {
      title: `${input.productName}｜${input.category}｜${input.features}`,
      subtitle: `為 ${input.targetAudience} 設計的 ${input.brandStyle} 商品上市首選。`,
      bullets: [`主打 ${input.features}`, `適合 ${input.targetAudience}`, `可在 ${channels} 展示與銷售`],
      description: `${input.productName} 以 ${input.features} 作為核心賣點，搭配 ${input.brandStyle} 的品牌語氣，協助 ${input.targetAudience} 更快理解商品價值。`,
      seoKeywords: [input.productName, input.category, input.targetAudience, ...input.salesChannels],
      complianceWarnings: ["實際上架前請確認平台規則、商標、圖片授權與法規限制"]
    },
    marketingPlan: {
      first7Days: ["完成商品頁與 FAQ", "發布 3 則主賣點貼文", "拍攝 1 支開箱或情境短影音"],
      first30Days: ["每週檢查 CTR、收藏、加購與客服問題", "依據問題調整商品頁", "測試套組或免運門檻"],
      channelStrategy: `${channels} 先驗證內容與成交訊號，再決定是否擴大投放。`,
      contentThemes: ["使用情境", "設計細節", "價格與價值", "FAQ 解答"],
      launchChecklist: ["商品頁完成", "包裝文案審核", "FAQ 上線", "首批內容排程", "風險文案檢查"]
    },
    socialContent: {
      posts: [`${input.productName} 的第一波貼文應聚焦 ${input.features} 與 ${input.targetAudience} 的日常情境。`],
      shortVideoScripts: [`Hook：${input.targetAudience} 常遇到的問題；中段展示 ${input.features}；結尾導向 ${channels}。`],
      creatorBrief: `請創作者以 ${input.brandStyle} 語氣示範真實使用情境，不要做保證效果或誇大承諾。`
    },
    customerSupport: {
      faq: [`Q：這適合誰？ A：主要適合 ${input.targetAudience}，尤其在意 ${input.features} 的使用者。`],
      objectionHandling: ["若覺得價格偏高，請回到材質、設計、用途與售後說明，不要只用折扣說服。"],
      replyScripts: [`謝謝詢問，${input.productName} 的核心特色是 ${input.features}，若你主要需求是 ${input.targetAudience} 的使用情境，我們會建議先看商品頁的規格與 FAQ。`]
    },
    legalRiskAssessment: {
      riskyClaims: ["保證銷售", "保證有效", "治療", "改善疾病"],
      saferAlternatives: ["可改寫為使用情境、材質特色、設計目的或顧客可自行判斷的描述"],
      requiredDisclaimers: ["AI 產出內容需人工審核", "實際上架前需確認平台規則與當地法規"],
      reviewNeeded: true
    },
    nextActions: [
      { priority: "high", action: "補齊商品規格與尺寸", reason: "規格不足會降低信任", expectedImpact: "降低客服疑慮", effort: "low" },
      { priority: "high", action: "確認競品價格帶", reason: "目前競品仍是假設", expectedImpact: "提高定價準確度", effort: "medium" },
      { priority: "medium", action: "拍攝 1 支短影音測試 hook", reason: "快速驗證客群是否理解主賣點", expectedImpact: "提升首週內容判斷力", effort: "medium" },
      { priority: "medium", action: "審核包裝與商品頁風險文案", reason: "避免平台審核或法規風險", expectedImpact: "降低上架阻礙", effort: "low" }
    ]
  };
}

function inferConfidenceLevel(analysis: RealAIProductAnalysis) {
  const missingCount = analysis.productDiagnosis.missingInformation.length;
  if (missingCount >= 5) return "low";
  if (missingCount >= 3) return "medium";
  return "high";
}
