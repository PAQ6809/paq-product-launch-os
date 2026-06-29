import type { HelpScope } from "@/lib/help/provider";

export const OUT_OF_SCOPE_HELP_ANSWER =
  "我目前只能協助 PAQ Product Launch OS 的網站功能、商品企劃流程、報告匯出、帳號與資料安全相關問題。你可以問我如何建立產品、產生報告、匯出檔案或恢復草稿。";

const outOfScopeKeywords = [
  "股票",
  "投資",
  "幣",
  "crypto",
  "stock",
  "investment",
  "作業",
  "essay",
  "homework",
  "天氣",
  "weather",
  "閒聊",
  "joke",
  "電影",
  "recipe",
  "食譜",
  "其他平台 api key",
  "api key 借我",
  "破解",
  "駭",
  "hack"
];

const siteKeywords = [
  "paq",
  "product launch",
  "商品",
  "產品",
  "企劃",
  "上市",
  "報告",
  "demo",
  "建立",
  "草稿",
  "autosave",
  "dashboard",
  "匯出",
  "export",
  "markdown",
  "json",
  "html",
  "csv",
  "zip",
  "shopify",
  "amazon",
  "etsy",
  "shopee",
  "蝦皮",
  "pinkoi",
  "翻譯",
  "translation",
  "locale",
  "rtl",
  "帳號",
  "登入",
  "signup",
  "login",
  "workspace",
  "supabase",
  "安全",
  "隱私",
  "privacy",
  "security",
  "rls",
  "加密",
  "encryption",
  "audit",
  "刪除資料",
  "資料匯出",
  "collection",
  "matrix",
  "legalrisknotes",
  "faq",
  "客服",
  "copy",
  "review",
  "審核",
  "nvidia",
  "openai",
  "mock",
  "fallback"
];

const accountKeywords = [
  "我的",
  "我之前",
  "歷史",
  "history",
  "草稿",
  "draft",
  "帳號",
  "account",
  "登入",
  "login",
  "workspace",
  "保存",
  "save",
  "匯出紀錄",
  "delete request",
  "刪除請求"
];

const complianceKeywords = [
  "法律",
  "法規",
  "合規",
  "legal",
  "privacy",
  "隱私",
  "安全",
  "security",
  "醫療",
  "保健",
  "美妝",
  "食品",
  "療效"
];

export type HelpScopeGuardResult = {
  allowed: boolean;
  scope: HelpScope;
  requiresAccountContext: boolean;
  needsComplianceDisclaimer: boolean;
  fixedAnswer?: string;
};

export function guardHelpScope(message: string): HelpScopeGuardResult {
  const normalized = message.toLowerCase();
  const siteRelated = siteKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
  const outOfScope = outOfScopeKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()));

  if (!siteRelated && outOfScope) {
    return outOfScopeResult();
  }

  if (!siteRelated && looksLikeGeneralQuestion(normalized)) {
    return outOfScopeResult();
  }

  const requiresAccountContext = accountKeywords.some((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );

  return {
    allowed: true,
    scope: requiresAccountContext ? "account_help" : "site_help",
    requiresAccountContext,
    needsComplianceDisclaimer: complianceKeywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase())
    )
  };
}

function outOfScopeResult(): HelpScopeGuardResult {
  return {
    allowed: false,
    scope: "out_of_scope",
    requiresAccountContext: false,
    needsComplianceDisclaimer: false,
    fixedAnswer: OUT_OF_SCOPE_HELP_ANSWER
  };
}

function looksLikeGeneralQuestion(normalized: string) {
  return normalized.trim().length > 0 && !siteKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}
