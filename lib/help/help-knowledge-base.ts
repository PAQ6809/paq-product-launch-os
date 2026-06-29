export type HelpKnowledgeBaseSection = {
  title: string;
  body: string;
  keywords: string[];
};

export const HELP_KNOWLEDGE_BASE_SECTIONS: HelpKnowledgeBaseSection[] = [
  {
    title: "產品定位",
    body:
      "PAQ Product Launch OS 的第一版目標是：上傳商品資料，AI 產出完整商品上市企劃書。它適合小品牌、文創商品、3C 配件、生活選物、香氛禮盒、學生創業專案與電商賣家。",
    keywords: ["定位", "PAQ", "介紹", "用途", "demo"]
  },
  {
    title: "建立商品與 autosave",
    body:
      "使用者可在 /products/new 輸入商品名稱、類別、功能、成本、售價、目標客群、品牌風格、銷售平台與圖片。未登入時會先以本機草稿保存；登入後可匯入匿名草稿並同步到 workspace。",
    keywords: ["建立", "商品", "autosave", "草稿", "匯入"]
  },
  {
    title: "AI 報告與 provider fallback",
    body:
      "商品上市報告會經由 server-side API route 產生。AI_PROVIDER 可切換 mock、openai、nvidia。沒有 key、輸出驗證失敗、或 production 未開 ENABLE_PUBLIC_REAL_AI 時會 fallback 到 mock，並在 metadata 顯示 warning。",
    keywords: ["AI", "provider", "mock", "openai", "nvidia", "fallback", "報告"]
  },
  {
    title: "報告審核、Copy 與風險提醒",
    body:
      "報告頁支援每個 section Copy、Edit、Approve、Reject。人工修改後會標記 human_edited。legalRiskNotes 會提醒 AI 內容需人工審核、商用授權、平台規則，以及食品、美妝、保健、醫療商品不得宣稱療效。",
    keywords: ["copy", "審核", "review", "legalRiskNotes", "風險", "療效"]
  },
  {
    title: "匯出格式",
    body:
      "目前支援 Markdown、JSON、HTML、CSV summary、ZIP package、Shopify / Shopee / Pinkoi / Amazon / Etsy 文字模板與社群貼文包。PDF、DOCX、PPTX 是 roadmap，不是目前正式功能。",
    keywords: ["匯出", "export", "markdown", "json", "html", "csv", "zip", "pdf", "docx", "pptx"]
  },
  {
    title: "多產品報告與 Product Matrix",
    body:
      "Report Collections 可把多個商品整理成一份分析報告，並用 Product Matrix 比較定位、價格、客群、上市狀態與風險。",
    keywords: ["collection", "多產品", "matrix", "Product Matrix", "報告書"]
  },
  {
    title: "翻譯、locale 與 RTL",
    body:
      "報告翻譯可切換繁中、英文、日文、韓文、阿文等已啟用 locale。阿文頁面使用 RTL。翻譯仍需人工審核，且不得新增原文沒有的療效或銷售保證。",
    keywords: ["翻譯", "locale", "英文", "阿文", "RTL", "bilingual"]
  },
  {
    title: "登入、資料保存與匿名草稿",
    body:
      "匿名使用可體驗 demo 與本機草稿。登入後才會保存商品、報告、report collections、匯出工作與安全事件到 Supabase workspace。匿名草稿可匯入登入帳號。",
    keywords: ["登入", "帳號", "anonymous", "workspace", "Supabase", "保存"]
  },
  {
    title: "安全、隱私與合規",
    body:
      "server-side route 保護第三方 API key。Supabase 資料以 RLS 依 user_id 隔離。敏感報告可設計加密。安全中心支援資料匯出與刪除請求。audit log 只記錄必要 metadata，Help v1 不保存完整對話。",
    keywords: ["安全", "隱私", "RLS", "encryption", "audit", "API key", "資料刪除"]
  },
  {
    title: "FAQ",
    body:
      "常見問題：如何建立產品、如何產生報告、報告能匯出哪些格式、為什麼需要登入、草稿是否會自動保存、資料是否安全、如何建立多產品報告書。",
    keywords: ["FAQ", "常見問題", "help", "說明"]
  }
];

export function getHelpKnowledgeBaseContext(message?: string) {
  if (!message) {
    return formatSections(HELP_KNOWLEDGE_BASE_SECTIONS);
  }

  const normalized = message.toLowerCase();
  const matched = HELP_KNOWLEDGE_BASE_SECTIONS.filter((section) =>
    section.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );

  return formatSections(matched.length > 0 ? matched : HELP_KNOWLEDGE_BASE_SECTIONS);
}

function formatSections(sections: HelpKnowledgeBaseSection[]) {
  return sections
    .map((section) => `## ${section.title}\n${section.body}`)
    .join("\n\n");
}
