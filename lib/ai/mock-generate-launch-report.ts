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
import type { ReportSection, RiskLevel } from "@/types";
import { formatCurrency, getMarginRate } from "@/lib/utils";

type SupportedCategory = "文創小物" | "3C 配件" | "生活香氛" | "general";

type CategoryStrategy = {
  label: SupportedCategory;
  tone: string;
  positioningAngle: string;
  buyerMotivation: string;
  proofPoint: string;
  channelMove: string;
  packagingMood: string;
  competitorNames: string[];
  seoSeeds: string[];
};

const categoryStrategies: Record<SupportedCategory, CategoryStrategy> = {
  "文創小物": {
    label: "文創小物",
    tone: "溫暖、有故事感、適合收藏與送禮",
    positioningAngle: "把日常小物做成有記憶點的設計禮物",
    buyerMotivation: "想買一個價格不高、但看得出品味與心意的小禮物",
    proofPoint: "材質、工藝細節與在地文化符號能被一眼辨識",
    channelMove: "以 Pinkoi、IG Reels 與市集展售建立第一波口碑",
    packagingMood: "溫潤紙材、留白版面、小面積燙金或壓紋，讓商品像可保存的禮物",
    competitorNames: ["插畫設計工作室", "地方文化選物店", "市集熱賣禮物組"],
    seoSeeds: ["文創禮物", "設計小物", "交換禮物", "台灣插畫", "手帳配件"]
  },
  "3C 配件": {
    label: "3C 配件",
    tone: "俐落、可信任、重視規格與使用情境",
    positioningAngle: "把技術規格轉譯成日常使用效率",
    buyerMotivation: "希望配件好用、好看、不要增加通勤負擔",
    proofPoint: "容量、相容性、快充能力、材質手感與安全認證資訊",
    channelMove: "以短影音展示痛點情境，再導到商品頁完成規格比較",
    packagingMood: "清楚規格 icon、黑白灰底色、重點規格大字呈現，避免過度炫技",
    competitorNames: ["高 CP 值手機配件品牌", "電商熱銷磁吸行動電源", "精品感科技選物店"],
    seoSeeds: ["3C 配件", "手機配件", "MagSafe", "行動電源", "快充"]
  },
  "生活香氛": {
    label: "生活香氛",
    tone: "安靜、感性、重視空間氛圍與送禮質感",
    positioningAngle: "把香氣變成每天回到家的情緒開關",
    buyerMotivation: "想讓房間更有質感，也需要一份不失禮的成熟禮物",
    proofPoint: "香調層次、擴香持久度、瓶器質感與不誇大功效的使用建議",
    channelMove: "以 IG 氛圍圖文、Threads 情境短文與 KOL 居家開箱累積信任",
    packagingMood: "霧面材質、低彩度色票、香調卡與留白構圖，像一份安靜的禮盒",
    competitorNames: ["居家香氛選物品牌", "質感擴香禮盒", "香氛生活風格店"],
    seoSeeds: ["生活香氛", "擴香", "香氛禮盒", "居家香氣", "療癒香氛"]
  },
  general: {
    label: "general",
    tone: "清楚、可信任、重視商品利益點",
    positioningAngle: "把商品特色整理成可理解、可比較、可購買的上市訊息",
    buyerMotivation: "希望快速判斷商品是否符合自己的使用情境與預算",
    proofPoint: "功能、材質、價格帶、使用情境與購買後支援",
    channelMove: "先完成商品頁與 FAQ，再用社群內容測試受眾反應",
    packagingMood: "乾淨版面、清楚資訊層級、避免過度承諾",
    competitorNames: ["同價位熱賣商品", "平台精選商品", "社群聲量商品"],
    seoSeeds: ["商品企劃", "新品上市", "商品文案", "開店工具", "品牌選物"]
  }
};

function normalizeCategory(category: string): SupportedCategory {
  if (category.includes("文創") || category.includes("小物")) {
    return "文創小物";
  }

  if (category.includes("3C") || category.toLowerCase().includes("tech") || category.includes("配件")) {
    return "3C 配件";
  }

  if (category.includes("香氛") || category.includes("擴香") || category.includes("香氣")) {
    return "生活香氛";
  }

  return "general";
}

function normalizeChannels(salesChannels: string[]) {
  return salesChannels.length > 0 ? salesChannels.join("、") : "品牌官網、社群與電商平台";
}

function buildCompetitors(input: LaunchReportInput, strategy: CategoryStrategy): CompetitorInsight[] {
  const basePrice = Math.max(input.targetPrice, 1);

  return strategy.competitorNames.map((name, index) => ({
    name,
    positioning:
      index === 0
        ? `主打成熟穩定的既有選擇，消費者容易信任，但商品故事較制式。`
        : index === 1
          ? `以平台流量與價格帶取勝，適合快速成交，但品牌差異較薄。`
          : `靠社群視覺與開箱內容吸引注意，聲量高但資訊完整度不一定足夠。`,
    priceRange: `${formatCurrency(Math.round(basePrice * (0.72 + index * 0.16)))} - ${formatCurrency(
      Math.round(basePrice * (0.96 + index * 0.22))
    )}`,
    strength:
      index === 0
        ? "可信度高、商品線完整、購買阻力低。"
        : index === 1
          ? "平台曝光強，價格容易被比較，也容易觸發衝動購買。"
          : "視覺記憶點強，適合社群分享與禮物情境。",
    gap:
      index === 0
        ? `${input.productName} 可以用更清楚的情境文案與 ${strategy.proofPoint} 做出差異。`
        : index === 1
          ? "避免只打低價，應把規格、材質與使用場景寫得更具體。"
          : "可以補齊 FAQ、客服話術與平台規格，讓轉換不只靠漂亮圖片。"
  }));
}

function buildSocialPosts(input: LaunchReportInput, strategy: CategoryStrategy): SocialPost[] {
  return [
    {
      platform: "IG",
      caption: `${input.productName} 是為了「${input.targetAudience}」設計的 ${input.category}。它不是只把功能列出來，而是把 ${input.features} 變成每天都用得到、也願意分享的商品體驗。`,
      hashtags: [`#${strategy.label === "general" ? input.category : strategy.label}`, "#新品上市", "#商品企劃"],
      cta: `想看完整規格與上市優惠，點進 ${normalizeChannels(input.salesChannels)} 查看。`
    },
    {
      platform: "Threads",
      caption: `我們在規劃 ${input.productName} 時，先問的不是「要寫多華麗」，而是：買家看到商品頁 10 秒內，能不能理解它為什麼適合自己。答案會落在三件事：情境、證據、價格理由。`,
      hashtags: ["#新品企劃", "#電商文案", "#PAQDemo"],
      cta: "留言告訴我們你最在意的購買疑慮。"
    },
    {
      platform: "TikTok",
      caption: `用 20 秒看懂 ${input.productName}：先丟出痛點，再展示核心功能，最後用價格與使用情境收尾。`,
      hashtags: ["#短影音腳本", "#新品上市", "#商品開箱"],
      cta: "收藏這支影片，上市時直接對照商品頁。"
    }
  ];
}

function buildVideoScripts(input: LaunchReportInput, strategy: CategoryStrategy): VideoScript[] {
  return [
    {
      title: `${input.productName} 25 秒情境開箱`,
      durationSeconds: 25,
      hook: `如果你也是 ${input.targetAudience}，這個痛點應該很熟。`,
      scenes: [
        "0-3 秒：拍出買家原本的困擾，畫面不要太滿，讓痛點一眼看懂。",
        `4-9 秒：切到商品近拍，展示 ${input.features}，只講一個最重要的利益點。`,
        `10-16 秒：放進真實使用情境，補上 ${strategy.proofPoint}，讓觀眾相信不是空話。`,
        `17-22 秒：呈現包裝、平台頁或購買入口，強化 ${input.brandStyle} 的品牌感。`,
        "23-25 秒：用一句 CTA 收尾，避免塞太多促銷訊息。"
      ],
      cta: `到 ${normalizeChannels(input.salesChannels)} 查看完整上市資訊。`
    },
    {
      title: `${input.productName} FAQ 快問快答`,
      durationSeconds: 35,
      hook: "買之前最常被問的三個問題，一次講清楚。",
      scenes: [
        `Q1：這適合誰？A：適合 ${input.targetAudience}。`,
        `Q2：跟同類商品差在哪？A：重點在 ${strategy.positioningAngle}。`,
        `Q3：為什麼定價 ${formatCurrency(input.targetPrice)}？A：因為同時考量成本、材質、通路與售後支援。`
      ],
      cta: "把疑問留在留言區，上市前我們會補進 FAQ。"
    }
  ];
}

function buildFaqs(input: LaunchReportInput, strategy: CategoryStrategy): FAQ[] {
  return [
    {
      question: `${input.productName} 適合什麼樣的人？`,
      answer: `適合 ${input.targetAudience}。商品溝通應聚焦在真實使用情境，而不是只堆功能。`
    },
    {
      question: `為什麼建議售價是 ${formatCurrency(input.targetPrice)}？`,
      answer: `這個價格同時考量成本 ${formatCurrency(input.cost)}、通路費用、包裝、內容製作與合理毛利。若要促銷，建議用首購組合或限時贈品，不要一開始就打深折。`
    },
    {
      question: "跟同價位商品相比，應該主打什麼差異？",
      answer: `主打 ${strategy.positioningAngle}，並用 ${strategy.proofPoint} 當作可信證據。`
    },
    {
      question: "這份報告可以直接對外使用嗎？",
      answer: "目前是 Mock AI Demo。正式上架前仍需人工審核，並確認法規、商標、版權、平台規則與商品實際資訊。"
    }
  ];
}

function buildCustomerServiceScripts(input: LaunchReportInput): CustomerServiceScript[] {
  return [
    {
      scenario: "客人詢問商品適不適合自己",
      response: `您好，${input.productName} 主要是為 ${input.targetAudience} 設計。如果您重視 ${input.features}，這款會很適合；若您有特定使用情境，也可以告訴我們，我們會協助確認。`
    },
    {
      scenario: "客人覺得價格偏高",
      response: `理解您的考量。這款商品的定價包含商品本身、包裝、品管與售後支援。若您是第一次購買，可以先參考首月上市方案或組合優惠。`
    },
    {
      scenario: "客人詢問出貨與退換貨",
      response: "下單後會依平台頁面標示時間出貨。若商品有瑕疵或運送損傷，請保留外盒與商品照片，我們會依平台規則協助處理。"
    }
  ];
}

function buildChecklist(input: LaunchReportInput): LaunchChecklistItem[] {
  return [
    { phase: "定位", task: "確認一句話定位、目標客群與核心賣點沒有互相矛盾。", ownerHint: "品牌 / 企劃" },
    { phase: "包裝", task: "檢查包裝文案、材質標示、注意事項與平台禁用語。", ownerHint: "設計 / 法規" },
    { phase: "上架", task: `完成 ${normalizeChannels(input.salesChannels)} 的標題、短描述、長描述、規格與 FAQ。`, ownerHint: "電商營運" },
    { phase: "內容", task: "準備 3 則社群貼文、2 支短影音腳本與 1 組客服話術。", ownerHint: "社群 / 影音" },
    { phase: "售前", task: "設定首月優惠、客服回覆節奏、庫存檢查與物流說明。", ownerHint: "營運 / 客服" },
    { phase: "優化", task: "上市後追蹤 CTR、加購率、FAQ 問題與退貨原因。", ownerHint: "數據 / 營運" }
  ];
}

function buildFirstMonthPlan(input: LaunchReportInput, strategy: CategoryStrategy): FirstMonthMarketingPlanItem[] {
  return [
    {
      week: "第 1 週",
      focus: "建立商品認知與等待名單",
      actions: [
        `發布 ${input.productName} 的商品故事與使用情境。`,
        "建立上市倒數內容，收集留言中的購買疑慮。",
        "把最常見疑問補進商品頁 FAQ。"
      ],
      metric: "貼文互動率、收藏數、商品頁點擊"
    },
    {
      week: "第 2 週",
      focus: "正式上架與第一波轉換",
      actions: [
        `在 ${normalizeChannels(input.salesChannels)} 同步上架商品頁。`,
        `用 ${strategy.channelMove} 做第一波導流。`,
        "安排 1 則開箱短影音與 1 則平台轉換貼文。"
      ],
      metric: "商品頁瀏覽、加購率、首購轉換率"
    },
    {
      week: "第 3 週",
      focus: "建立信任與處理疑慮",
      actions: [
        "整理客服問題，新增商品頁 FAQ 與限動問答。",
        `強化 ${strategy.proofPoint} 的證據內容。`,
        "測試不同首圖與標題，觀察點擊率差異。"
      ],
      metric: "客服問題量、FAQ 點擊、社群轉換"
    },
    {
      week: "第 4 週",
      focus: "優化素材與準備第二波銷售",
      actions: [
        "檢查 CTR、加購率與退貨原因，調整商品頁順序。",
        "將高互動貼文改成廣告素材草稿。",
        "規劃第二波組合包、加價購或會員限定內容。"
      ],
      metric: "轉換率、毛利、回購或追蹤名單成長"
    }
  ];
}

function buildOptimizationSuggestions(): OptimizationSuggestion[] {
  return [
    {
      signal: "商品頁點擊率高但加購率低",
      action: "優先檢查首圖、價格理由、規格表與 FAQ 是否回答到購買疑慮。",
      why: "代表受眾有興趣，但還缺少足夠信任或購買理由。"
    },
    {
      signal: "客服反覆詢問同一類問題",
      action: "把問題補進商品頁 FAQ、短影音腳本與客服快捷回覆。",
      why: "重複問題通常是商品頁資訊不足，修正後可以降低客服成本。"
    },
    {
      signal: "社群互動高但銷售低",
      action: "檢查 CTA 是否明確、購買入口是否太遠、首月優惠是否有時間限制。",
      why: "內容能引起興趣，但轉換路徑可能不夠順。"
    }
  ];
}

export function generateMockLaunchReport(input: LaunchReportInput): LaunchReport {
  const categoryKey = normalizeCategory(input.category);
  const strategy = categoryStrategies[categoryKey];
  const channels = normalizeChannels(input.salesChannels);
  const marginRate = getMarginRate(input.cost, input.targetPrice);
  const floorPrice = Math.max(input.cost * 1.75, input.targetPrice * 0.86);
  const premiumPrice = input.targetPrice * 1.18;

  return {
    productName: input.productName,
    category: input.category,
    generatedAt: new Date().toISOString(),
    isMock: true,
    positioning: `${input.productName} 的定位是「${strategy.positioningAngle}」。它要把 ${input.features} 轉成 ${input.targetAudience} 能立即理解的購買理由，語氣保持 ${strategy.tone}，避免只做功能清單。`,
    targetAudienceAnalysis: `${input.targetAudience} 的購買決策通常不是只看價格，而是同時看使用情境、可信證據、視覺質感與購買後支援。建議在 ${channels} 上用「痛點情境 -> 可信證據 -> 價格理由 -> CTA」的順序溝通。`,
    keySellingPoints: [
      `情境清楚：直接對應 ${input.targetAudience} 的日常需求。`,
      `證據具體：用 ${strategy.proofPoint} 支撐賣點，不靠空泛形容詞。`,
      `品牌一致：包裝、商品頁與社群語氣都維持 ${input.brandStyle}。`,
      "轉換友善：商品頁包含標題、短描述、長描述、FAQ、客服話術與首月行銷計畫。",
      `通路可用：內容可直接改寫到 ${channels}，方便快速 demo 與測試。`
    ],
    competitorAnalysis: buildCompetitors(input, strategy),
    pricingStrategy: {
      suggestedPrice: input.targetPrice,
      floorPrice: Math.round(floorPrice),
      premiumPrice: Math.round(premiumPrice),
      marginRate,
      rationale: `以成本 ${formatCurrency(input.cost)} 與預計售價 ${formatCurrency(input.targetPrice)} 推估，毛利率約 ${marginRate}%。第一版不建議用低價搶市場，而是用包裝、內容完整度與購買後支援建立合理價格理由。`,
      promoNotes: "首月可以用限量贈品、組合包或免運門檻測試轉換，不建議長期折扣，避免讓品牌一開始就被價格錨定。"
    },
    packagingBrief: {
      concept: `${input.productName} 的包裝要讓人一眼理解「${strategy.positioningAngle}」，並把商品從一般平台品項拉成可送禮、可收藏、可信任的選擇。`,
      visualDirection: `${strategy.packagingMood}。主視覺要留下足夠資訊層級，避免為了好看而犧牲規格、注意事項與品牌識別。`,
      materials: "第一版可先以可量產、成本可控的材質規劃，例如紙盒、腰封、貼紙、說明卡或可回收緩衝材；正式量產前需請印刷廠確認色差、加工限制與單位成本。",
      requiredElements: ["品牌名稱", "商品名稱", "核心賣點", "規格或內容物", "使用注意事項", "客服或售後入口", "法規與平台必要標示"],
      complianceNotes: [
        "食品、美妝、保健、醫療相關商品不得宣稱療效或保證效果。",
        "包裝圖像、字體、插畫、商標與照片需確認授權來源。",
        "正式上架前需依銷售平台規則與商品類別完成人工審核。"
      ]
    },
    frontPackagingCopy: `${input.productName}\n${strategy.positioningAngle}\n為 ${input.targetAudience} 設計的 ${input.category}`,
    backPackagingCopy: `${input.productName} 以 ${input.features} 為核心，搭配 ${input.brandStyle} 的品牌語氣，讓 ${input.targetAudience} 可以快速理解使用情境、商品差異與購買理由。正式印刷前請確認規格、注意事項、授權素材與平台規則。`,
    productTitle: `${input.productName}｜${input.category}｜${strategy.positioningAngle}`,
    shortDescription: `${input.productName} 是為 ${input.targetAudience} 設計的 ${input.category}，主打 ${input.features}，適合想要兼顧實用、質感與清楚購買理由的客群。`,
    longDescription: `${input.productName} 不只是把功能放上商品頁，而是把商品放回真實使用情境。它以 ${input.features} 為核心，搭配 ${input.brandStyle} 的品牌表達，讓 ${input.targetAudience} 在看到商品頁時能快速理解「適不適合我、為什麼是這個價格、跟同類商品差在哪」。第一版內容建議同時準備包裝文案、商品頁長短描述、FAQ、客服回覆與社群素材，讓上市溝通不只靠一張圖片。`,
    seoKeywords: [
      input.productName,
      input.category,
      ...strategy.seoSeeds,
      ...input.salesChannels,
      "新品上市",
      "商品企劃"
    ],
    socialPosts: buildSocialPosts(input, strategy),
    videoScripts: buildVideoScripts(input, strategy),
    faqs: buildFaqs(input, strategy),
    customerServiceScripts: buildCustomerServiceScripts(input),
    launchChecklist: buildChecklist(input),
    firstMonthMarketingPlan: buildFirstMonthPlan(input, strategy),
    optimizationSuggestions: buildOptimizationSuggestions(),
    legalRiskNotes: [
      "AI 產出內容需人工審核，不可直接作為正式法規、商標、版權或商品合規建議。",
      "包裝設計、照片、插圖、字體、音樂與其他素材需確認商用授權。",
      "食品、美妝、保健與醫療相關商品不得宣稱療效、治療、改善疾病或保證效果。",
      "實際上架前需依銷售平台規則與當地法規再次檢查。"
    ]
  };
}

function formatList(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function formatCompetitors(items: CompetitorInsight[]) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name}\n定位：${item.positioning}\n價格帶：${item.priceRange}\n優勢：${item.strength}\n可切入缺口：${item.gap}`
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
    .map(
      (item, index) =>
        `${index + 1}. ${item.title}（${item.durationSeconds} 秒）\nHook：${item.hook}\n${formatList(
          item.scenes
        )}\nCTA：${item.cta}`
    )
    .join("\n\n");
}

function formatFaqs(items: FAQ[]) {
  return items.map((item) => `Q：${item.question}\nA：${item.answer}`).join("\n\n");
}

function formatFirstMonthPlan(items: FirstMonthMarketingPlanItem[]) {
  return items
    .map(
      (item) =>
        `${item.week}｜${item.focus}\n行動：\n${formatList(item.actions)}\n觀察指標：${item.metric}`
    )
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
  return [
    section("positioning", "商品定位", report.positioning, "medium"),
    section("target-audience", "目標客群分析", report.targetAudienceAnalysis, "low"),
    section("key-selling-points", "核心賣點", formatList(report.keySellingPoints), "medium"),
    section("competitor-analysis", "競品分析", formatCompetitors(report.competitorAnalysis), "high"),
    section(
      "pricing-strategy",
      "定價建議",
      `建議售價：${formatCurrency(report.pricingStrategy.suggestedPrice)}
最低可接受價格：${formatCurrency(report.pricingStrategy.floorPrice)}
高值感測試價格：${formatCurrency(report.pricingStrategy.premiumPrice)}
預估毛利率：${report.pricingStrategy.marginRate}%

${report.pricingStrategy.rationale}

促銷建議：${report.pricingStrategy.promoNotes}`,
      "medium"
    ),
    section(
      "packaging-brief",
      "包裝設計 brief",
      `概念：${report.packagingBrief.concept}

視覺方向：${report.packagingBrief.visualDirection}

材質與量產注意：${report.packagingBrief.materials}

必要元素：
${formatList(report.packagingBrief.requiredElements)}

法規與平台提醒：
${formatList(report.packagingBrief.complianceNotes)}`,
      "high"
    ),
    section("front-packaging-copy", "包裝正面文案", report.frontPackagingCopy, "high"),
    section("back-packaging-copy", "包裝背面文案", report.backPackagingCopy, "high"),
    section(
      "listing-copy",
      "商品頁文案",
      `商品頁標題
${report.productTitle}

商品短描述
${report.shortDescription}

商品長描述
${report.longDescription}`,
      "medium"
    ),
    section("seo-keywords", "SEO 關鍵字", report.seoKeywords.join("、"), "low"),
    section("social-posts", "IG / Threads / TikTok 文案", formatSocialPosts(report.socialPosts), "low"),
    section("video-scripts", "短影音腳本", formatVideoScripts(report.videoScripts), "medium"),
    section("faqs", "FAQ", formatFaqs(report.faqs), "medium"),
    section(
      "customer-service-scripts",
      "客服話術",
      report.customerServiceScripts
        .map((item, index) => `${index + 1}. 情境：${item.scenario}\n回覆：${item.response}`)
        .join("\n\n"),
      "medium"
    ),
    section("first-month-marketing-plan", "首月行銷計畫", formatFirstMonthPlan(report.firstMonthMarketingPlan), "medium"),
    section("optimization-suggestions", "銷售後優化建議", formatOptimization(report.optimizationSuggestions), "low"),
    section(
      "legal-risk-notes",
      "法規與風險提醒",
      formatList(report.legalRiskNotes),
      "high"
    )
  ];
}
