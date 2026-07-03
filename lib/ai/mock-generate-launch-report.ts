import { buildFallbackAnalysis } from "@/lib/ai/normalize-launch-report";
import { formatCurrency, getMarginRate } from "@/lib/utils";
import type { ReportSection, RiskLevel } from "@/types";
import type {
  CompetitorInsight,
  CustomerServiceScript,
  FAQ,
  FirstMonthMarketingPlanItem,
  LaunchChecklistItem,
  LaunchReport,
  LaunchReportInput,
  OptimizationSuggestion,
  SocialPost,
  VideoScript
} from "@/types/report";

type CategoryStrategy = {
  tone: string;
  positioningAngle: string;
  buyerMotivation: string;
  proofPoint: string;
  packagingMood: string;
  competitorNames: string[];
  seoSeeds: string[];
};

const categoryStrategies: Record<string, CategoryStrategy> = {
  creative: {
    tone: "溫暖、具故事感，強調收藏、送禮與日常儀式",
    positioningAngle: "把日常小物變成可被記住的風格選品",
    buyerMotivation: "想買一個有設計感、能代表心意、價格不過度負擔的小禮物",
    proofPoint: "材質、插畫、紙感或手感細節能被清楚看見",
    packagingMood: "紙材質感、留白、細緻字距與小卡式開箱",
    competitorNames: ["平台設計小物品牌", "插畫周邊工作室", "文具選物店"],
    seoSeeds: ["文創小物", "設計禮物", "文具禮盒", "日常收藏"]
  },
  tech: {
    tone: "俐落、可信、重視規格與使用效率",
    positioningAngle: "用輕薄與相容性解決日常充電或攜帶痛點",
    buyerMotivation: "希望配件可靠、好帶、不破壞設備使用手感",
    proofPoint: "尺寸、重量、相容性、安全提示與使用情境說明",
    packagingMood: "清楚規格 icon、深淺對比、簡潔資訊層級",
    competitorNames: ["高 CP 值 3C 配件", "品牌原廠配件", "薄型磁吸行動電源"],
    seoSeeds: ["3C 配件", "MagSafe", "行動電源", "輕薄配件"]
  },
  aroma: {
    tone: "安定、感官、重視空間氛圍與送禮質感",
    positioningAngle: "用香氣與包裝建立可送禮的生活儀式",
    buyerMotivation: "想讓空間更有氛圍，或找一份不過度制式的禮盒",
    proofPoint: "香調、擴香方式、容量、使用空間與注意事項",
    packagingMood: "霧面紙盒、低彩度色票、香調卡與開箱層次",
    competitorNames: ["生活香氛禮盒", "居家擴香品牌", "香氛選物店"],
    seoSeeds: ["生活香氛", "擴香禮盒", "居家香氛", "送禮"]
  },
  general: {
    tone: "清楚、商業、偏向可快速驗證的上市提案",
    positioningAngle: "把商品功能轉成明確客群與通路可理解的購買理由",
    buyerMotivation: "需要一個價格合理、用途清楚、風格一致的商品",
    proofPoint: "功能、價格、包裝、FAQ 與社群內容的一致性",
    packagingMood: "乾淨資訊層級、主賣點優先、方便平台上架",
    competitorNames: ["同類平台熱銷商品", "低價替代品", "設計感競品"],
    seoSeeds: ["商品上市", "新品企劃", "商品頁文案", "社群行銷"]
  }
};

function getStrategy(category: string): CategoryStrategy {
  if (/文創|文具|小物|設計|插畫/u.test(category)) return categoryStrategies.creative;
  if (/3C|配件|充電|電源|MagSafe|tech/iu.test(category)) return categoryStrategies.tech;
  if (/香氛|擴香|香氣|居家|禮盒/u.test(category)) return categoryStrategies.aroma;
  return categoryStrategies.general;
}

function channelLabel(channels: string[]) {
  return channels.length > 0 ? channels.join("、") : "自有官網與社群";
}

function buildCompetitors(input: LaunchReportInput, strategy: CategoryStrategy): CompetitorInsight[] {
  return strategy.competitorNames.map((name, index) => ({
    name,
    positioning: index === 0 ? "以價格與曝光量取得第一眼注意" : index === 1 ? "以品牌可信度或視覺風格建立選擇理由" : "以平台評價與套組增加轉換",
    priceRange: `${formatCurrency(Math.round(input.targetPrice * (0.78 + index * 0.12)))} - ${formatCurrency(Math.round(input.targetPrice * (1.05 + index * 0.18)))}`,
    strength: index === 0 ? "價格或平台能見度較強" : index === 1 ? "品牌感與視覺辨識度較完整" : "商品組合與評論累積較容易降低疑慮",
    gap: `${input.productName} 可以用「${strategy.positioningAngle}」避開單純價格戰，並把 ${strategy.proofPoint} 做成商品頁與短影音重點。`
  }));
}

function buildSocialPosts(input: LaunchReportInput): SocialPost[] {
  return [
    {
      platform: "IG",
      caption: `${input.productName} 不是只列功能，而是為 ${input.targetAudience} 準備的 ${input.category}。第一波內容建議聚焦 ${input.features}，讓買家在 3 秒內理解為什麼需要它。`,
      hashtags: [`#${input.category.replace(/\s+/g, "")}`, "#商品上市", "#PAQDemo"],
      cta: `在 ${channelLabel(input.salesChannels)} 查看完整商品頁。`
    },
    {
      platform: "Threads",
      caption: `如果要讓 ${input.productName} 第一週有討論度，重點不是把功能塞滿，而是先回答：誰會買、為什麼現在買、跟競品差在哪。`,
      hashtags: ["#新品企劃", "#電商文案", "#商品定位"],
      cta: "留言告訴我們你最在意價格、外觀還是使用情境。"
    },
    {
      platform: "TikTok",
      caption: `用 20 秒展示 ${input.productName}：先丟出 ${input.targetAudience} 的痛點，再展示 ${input.features}，最後帶到購買通路。`,
      hashtags: ["#短影音腳本", "#商品開箱", "#新品上市"],
      cta: "看完到商品頁確認規格與 FAQ。"
    }
  ];
}

function buildVideoScripts(input: LaunchReportInput, proofPoint: string, positioningAngle: string): VideoScript[] {
  return [
    {
      title: `${input.productName} 25 秒上市短影音`,
      durationSeconds: 25,
      hook: `${input.targetAudience} 常常需要的不是更多選擇，而是一個更清楚的解法。`,
      scenes: [
        `0-3 秒：展示 ${input.targetAudience} 的日常問題。`,
        `4-9 秒：帶出 ${input.productName} 與 ${input.features}。`,
        `10-16 秒：近拍 ${proofPoint}。`,
        `17-22 秒：展示包裝、商品頁或使用情境。`,
        "23-25 秒：CTA 導向商品頁與 FAQ。"
      ],
      cta: `到 ${channelLabel(input.salesChannels)} 查看上市首波資訊。`
    },
    {
      title: `${input.productName} FAQ 型短影音`,
      durationSeconds: 35,
      hook: "買之前最常被問的 3 個問題，一次講清楚。",
      scenes: [
        `Q1：適合誰？A：主要適合 ${input.targetAudience}。`,
        `Q2：差異在哪？A：主打 ${positioningAngle}。`,
        `Q3：價格合理嗎？A：以 ${formatCurrency(input.targetPrice)} 對應功能、包裝與通路成本。`
      ],
      cta: "更多規格與注意事項請看商品頁。"
    }
  ];
}

function buildFaqs(input: LaunchReportInput, strategy: CategoryStrategy): FAQ[] {
  return [
    { question: `${input.productName} 適合誰？`, answer: `主要適合 ${input.targetAudience}，尤其是重視 ${input.features} 的買家。` },
    { question: `為什麼定價是 ${formatCurrency(input.targetPrice)}？`, answer: `此價格需同時覆蓋成本 ${formatCurrency(input.cost)}、包裝、平台抽成、金流、物流與首波內容製作。` },
    { question: "跟相近商品差在哪？", answer: `建議主打 ${strategy.positioningAngle}，並用 ${strategy.proofPoint} 建立差異。` },
    { question: "上市前需要人工檢查什麼？", answer: "請檢查包裝文案、圖片授權、商標、平台規則與法規敏感宣稱。" }
  ];
}

function buildCustomerServiceScripts(input: LaunchReportInput): CustomerServiceScript[] {
  return [
    { scenario: "客戶詢問適合用途", response: `您好，${input.productName} 主要適合 ${input.targetAudience}，特色是 ${input.features}。若您在意的是使用情境與規格，我們建議先查看商品頁的詳細說明。` },
    { scenario: "客戶覺得價格偏高", response: `理解您的考量。此商品的價格包含商品成本、包裝、平台與物流等上市成本。我們會建議您比較功能、材質與售後資訊，再決定是否符合需求。` },
    { scenario: "客戶詢問效果承諾", response: "商品頁會以實際規格、使用方式與注意事項為主，不以效果承諾作為購買理由。購買前也歡迎先確認需求是否相符。" }
  ];
}

function buildChecklist(): LaunchChecklistItem[] {
  return [
    { phase: "定位", task: "確認一句話定位與 3 個核心賣點", ownerHint: "品牌 / 企劃" },
    { phase: "包裝", task: "審核正面、背面文案與必要法規資訊", ownerHint: "設計 / 法務" },
    { phase: "上架", task: "完成商品頁標題、短描述、長描述、規格與 FAQ", ownerHint: "電商營運" },
    { phase: "行銷", task: "排程首週社群貼文與短影音腳本", ownerHint: "內容 / 社群" },
    { phase: "優化", task: "追蹤收藏、加購、客服問題與轉換訊號", ownerHint: "營運 / 數據" }
  ];
}

function buildFirstMonthPlan(input: LaunchReportInput, strategy: CategoryStrategy): FirstMonthMarketingPlanItem[] {
  return [
    { week: "第 1 週", focus: "完成上市素材與商品頁", actions: [`整理 ${input.productName} 的核心定位`, "建立 FAQ 與客服回覆", "發布 3 則主賣點貼文"], metric: "商品頁點擊、收藏、客服問題數" },
    { week: "第 2 週", focus: "驗證社群內容 hook", actions: ["發布 1 支短影音", `測試 ${strategy.buyerMotivation} 相關角度`, "蒐集留言與私訊問題"], metric: "短影音停留率、互動率" },
    { week: "第 3 週", focus: "優化商品頁與疑慮處理", actions: ["把高頻問題補進商品頁", "調整標題與首屏文案", "測試免運或組合方案"], metric: "加購率、結帳率" },
    { week: "第 4 週", focus: "決定是否擴大通路", actions: ["比較不同通路轉換", "整理顧客回饋", "規劃第二波內容或小改版"], metric: "轉換率、毛利、回購或推薦訊號" }
  ];
}

function buildOptimizationSuggestions(input: LaunchReportInput): OptimizationSuggestion[] {
  return [
    { signal: "商品頁有點擊但加購偏低", action: "強化首屏賣點與 FAQ，補上規格與情境圖", why: "點擊代表有興趣，加購偏低通常是理解或信任不足" },
    { signal: "客服重複詢問價格或尺寸", action: "把價格邏輯、尺寸、材質與注意事項放在更前面", why: "重複問題就是商品頁資訊排序需要修正" },
    { signal: "社群互動高但轉換低", action: `把 CTA 從泛用導購改成「查看 ${input.productName} 規格與上市優惠」`, why: "互動內容需要更直接連到購買理由" }
  ];
}

export function generateMockLaunchReport(input: LaunchReportInput): LaunchReport {
  const strategy = getStrategy(input.category);
  const marginRate = getMarginRate(input.cost, input.targetPrice);
  const floorPrice = Math.max(input.cost * 1.7, input.targetPrice * 0.86);
  const premiumPrice = input.targetPrice * 1.18;
  const channels = channelLabel(input.salesChannels);
  const analysis = buildFallbackAnalysis(input);
  const generatedAt = new Date().toISOString();

  return {
    productName: input.productName,
    category: input.category,
    generatedAt,
    isMock: true,
    positioning: `${input.productName} 是為 ${input.targetAudience} 打造的 ${input.category}，以「${strategy.positioningAngle}」作為主定位，將 ${input.features} 轉成可被 ${channels} 溝通的上市賣點。`,
    targetAudienceAnalysis: `${input.targetAudience} 的購買動機多半來自「${strategy.buyerMotivation}」。首版內容應先處理價格合理性、使用情境與實物可信度，而不是只列商品功能。`,
    keySellingPoints: [
      `明確客群：鎖定 ${input.targetAudience}，避免一開始做成所有人都可以買的模糊商品。`,
      `可視化證據：用 ${strategy.proofPoint} 支撐主賣點。`,
      `通路可落地：內容可拆成 ${channels} 的商品頁、貼文與短影音。`,
      `價格有測試空間：目標售價 ${formatCurrency(input.targetPrice)} 搭配首月內容驗證，而非直接降價。`
    ],
    competitorAnalysis: buildCompetitors(input, strategy),
    pricingStrategy: {
      suggestedPrice: input.targetPrice,
      floorPrice: Math.round(floorPrice),
      premiumPrice: Math.round(premiumPrice),
      marginRate,
      rationale: `以成本 ${formatCurrency(input.cost)}、目標售價 ${formatCurrency(input.targetPrice)} 推估，粗估毛利率約 ${marginRate}%。實際仍需扣除平台抽成、金流、物流、包材與退換貨成本。`,
      promoNotes: "首月建議用限量贈品、免運門檻或套組提高價值感，不建議長期直接折扣，以免破壞定位。"
    },
    packagingBrief: {
      concept: `${input.brandStyle} 的上市包裝，讓買家第一眼理解 ${input.productName} 的用途與情緒價值。`,
      visualDirection: strategy.packagingMood,
      materials: "先採可量產、成本可控的紙盒 / 紙卡 / 貼紙組合，正式打樣前確認單件包材成本。",
      requiredElements: ["商品名稱", "一句話定位", "核心賣點", "規格資訊", "注意事項", "品牌與客服資訊"],
      complianceNotes: ["AI 產出內容需人工審核", "圖片、插畫、字體與包裝素材需確認商用授權", "高風險品類不得宣稱療效或保證效果"]
    },
    frontPackagingCopy: `${input.productName}\n${strategy.positioningAngle}\n為 ${input.targetAudience} 準備的 ${input.category}`,
    backPackagingCopy: `${input.productName} 以 ${input.features} 作為核心特色，搭配 ${input.brandStyle} 的品牌語氣，適合 ${input.targetAudience} 在日常、送禮或特定情境中使用。實際規格、材質與注意事項請以上架頁面為準。`,
    productTitle: `${input.productName}｜${input.category}｜${strategy.positioningAngle}`,
    shortDescription: `${input.productName} 是一款為 ${input.targetAudience} 設計的 ${input.category}，主打 ${input.features}，適合在 ${channels} 作為首波上市商品。`,
    longDescription: `${input.productName} 的上市策略不應只停在功能介紹，而要把 ${input.features} 轉成 ${input.targetAudience} 能理解的購買理由。建議商品頁以「誰適合、為什麼需要、跟競品差在哪、價格如何成立」為主軸，搭配 ${input.brandStyle} 的視覺與語氣，讓包裝、商品頁、社群貼文與短影音保持一致。`,
    seoKeywords: Array.from(new Set([input.productName, input.category, ...strategy.seoSeeds, ...input.salesChannels, "商品上市企劃", "商品頁文案"])),
    socialPosts: buildSocialPosts(input),
    videoScripts: buildVideoScripts(input, strategy.proofPoint, strategy.positioningAngle),
    faqs: buildFaqs(input, strategy),
    customerServiceScripts: buildCustomerServiceScripts(input),
    launchChecklist: buildChecklist(),
    firstMonthMarketingPlan: buildFirstMonthPlan(input, strategy),
    optimizationSuggestions: buildOptimizationSuggestions(input),
    legalRiskNotes: [
      "AI 產出內容需人工審核後才可用於正式包裝、商品頁與廣告。",
      "包裝設計、圖片、插畫、字體與素材需確認商用授權。",
      "食品、美妝、保健、醫療相關商品不得宣稱療效、治療、改善疾病或保證效果。",
      "實際上架前需依銷售平台規則與當地法規再次檢查。"
    ],
    analysis,
    metadata: {
      provider: "mock",
      model: "paq-mock-v1",
      isAiGenerated: true,
      isFallback: true,
      generatedAt,
      assumptionsUsed: analysis.productDiagnosis.assumptions,
      confidenceLevel: "medium",
      validationPassed: true,
      warnings: ["Mock analysis. Use real AI only after login and provider gating pass."]
    }
  };
}

function formatList(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function formatCompetitors(items: CompetitorInsight[]) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name}\n定位：${item.positioning}\n價格帶：${item.priceRange}\n優勢：${item.strength}\n缺口：${item.gap}`
    )
    .join("\n\n");
}

function formatSocialPosts(items: SocialPost[]) {
  return items
    .map((item) => `[${item.platform}]\n${item.caption}\n${item.hashtags.join(" ")}\nCTA：${item.cta}`)
    .join("\n\n");
}

function formatVideoScripts(items: VideoScript[]) {
  return items
    .map((item, index) => `${index + 1}. ${item.title}（${item.durationSeconds} 秒）\nHook：${item.hook}\n${formatList(item.scenes)}\nCTA：${item.cta}`)
    .join("\n\n");
}

function formatFaqs(items: FAQ[]) {
  return items.map((item) => `Q：${item.question}\nA：${item.answer}`).join("\n\n");
}

function formatFirstMonthPlan(items: FirstMonthMarketingPlanItem[]) {
  return items
    .map((item) => `${item.week}｜${item.focus}\n行動：\n${formatList(item.actions)}\n追蹤指標：${item.metric}`)
    .join("\n\n");
}

function formatOptimization(items: OptimizationSuggestion[]) {
  return items
    .map((item, index) => `${index + 1}. 訊號：${item.signal}\n建議行動：${item.action}\n原因：${item.why}`)
    .join("\n\n");
}

function section(id: string, title: string, content: string, riskLevel: RiskLevel = "medium"): ReportSection {
  return {
    id,
    title,
    content,
    riskLevel,
    reviewStatus: "draft"
  };
}

export function launchReportToSections(report: LaunchReport): ReportSection[] {
  const analysis = report.analysis;
  const analysisSection = analysis
    ? [
        section(
          "real-ai-analysis",
          "真實 AI 商品診斷",
          `摘要：${analysis.executiveSummary.summary}\n\n機會：\n${formatList(analysis.executiveSummary.keyOpportunities)}\n\n風險：\n${formatList(analysis.executiveSummary.keyRisks)}\n\n下一步：\n${formatList(analysis.nextActions.map((item) => `${item.priority}｜${item.action}｜${item.reason}`))}`,
          "medium"
        )
      ]
    : [];

  return [
    ...analysisSection,
    section("positioning", "商品定位", report.positioning, "medium"),
    section("target-audience", "目標客群分析", report.targetAudienceAnalysis, "low"),
    section("key-selling-points", "核心賣點", formatList(report.keySellingPoints), "medium"),
    section("competitor-analysis", "競品分析", formatCompetitors(report.competitorAnalysis), "high"),
    section(
      "pricing-strategy",
      "定價建議",
      `建議售價：${formatCurrency(report.pricingStrategy.suggestedPrice)}
最低可接受價格：${formatCurrency(report.pricingStrategy.floorPrice)}
高價測試價格：${formatCurrency(report.pricingStrategy.premiumPrice)}
粗估毛利率：${report.pricingStrategy.marginRate}%

${report.pricingStrategy.rationale}

促銷建議：${report.pricingStrategy.promoNotes}`,
      "medium"
    ),
    section(
      "packaging-brief",
      "包裝設計 brief",
      `概念：${report.packagingBrief.concept}

視覺方向：${report.packagingBrief.visualDirection}

材質與成本提醒：${report.packagingBrief.materials}

必要元素：
${formatList(report.packagingBrief.requiredElements)}

合規提醒：
${formatList(report.packagingBrief.complianceNotes)}`,
      "high"
    ),
    section("front-packaging-copy", "包裝正面文案", report.frontPackagingCopy, "high"),
    section("back-packaging-copy", "包裝背面文案", report.backPackagingCopy, "high"),
    section(
      "listing-copy",
      "商品頁文案",
      `商品頁標題：${report.productTitle}

商品短描述：${report.shortDescription}

商品長描述：${report.longDescription}`,
      "medium"
    ),
    section("seo-keywords", "SEO 關鍵字", report.seoKeywords.join("、"), "low"),
    section("social-posts", "IG / Threads / TikTok 文案", formatSocialPosts(report.socialPosts), "low"),
    section("video-scripts", "短影音腳本", formatVideoScripts(report.videoScripts), "medium"),
    section("faqs", "FAQ", formatFaqs(report.faqs), "medium"),
    section(
      "customer-service-scripts",
      "客服話術",
      report.customerServiceScripts.map((item, index) => `${index + 1}. 情境：${item.scenario}\n回覆：${item.response}`).join("\n\n"),
      "medium"
    ),
    section("first-month-marketing-plan", "首月行銷計畫", formatFirstMonthPlan(report.firstMonthMarketingPlan), "medium"),
    section("optimization-suggestions", "銷售後優化建議", formatOptimization(report.optimizationSuggestions), "low"),
    section("legal-risk-notes", "法規與風險提醒", formatList(report.legalRiskNotes), "high")
  ];
}
