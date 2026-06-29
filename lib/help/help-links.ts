import { defaultLocale, isSupportedLocale, type AppLocale } from "@/i18n/routing";
import type { HelpRelatedLink } from "@/lib/help/provider";

type HelpLinkDefinition = HelpRelatedLink & {
  keywords: string[];
};

const helpLinkDefinitions: HelpLinkDefinition[] = [
  {
    label: "首頁",
    href: "/",
    description: "查看產品定位與 Demo 商品入口。",
    keywords: ["首頁", "home", "demo", "展示"]
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "查看產品、草稿、報告與待處理項目。",
    keywords: ["dashboard", "儀表板", "歷史", "產品列表"]
  },
  {
    label: "產品列表",
    href: "/products",
    description: "查看已建立的商品與生命週期狀態。",
    keywords: ["產品", "商品", "歷史", "product"]
  },
  {
    label: "建立商品企劃",
    href: "/products/new",
    description: "輸入商品資料並產生上市企劃報告。",
    keywords: ["建立", "新增", "產品", "商品", "草稿", "autosave", "自動保存"]
  },
  {
    label: "多產品報告書",
    href: "/reports/collections",
    description: "建立 report collection 與 Product Matrix。",
    keywords: ["collection", "collections", "多產品", "矩陣", "matrix", "報告書"]
  },
  {
    label: "安全中心",
    href: "/settings/security",
    description: "查看資料匯出、刪除請求與安全設定。",
    keywords: ["安全", "隱私", "資料", "刪除", "匯出", "security", "privacy"]
  },
  {
    label: "Privacy Policy",
    href: "/legal/privacy",
    description: "了解資料使用與隱私政策草案。",
    keywords: ["privacy", "隱私", "資料", "個資"]
  },
  {
    label: "Terms of Service",
    href: "/legal/terms",
    description: "查看服務條款草案。",
    keywords: ["terms", "條款", "法律", "服務"]
  }
];

export function buildHelpLinks(locale: string | undefined = defaultLocale): HelpRelatedLink[] {
  const normalizedLocale = isSupportedLocale(locale ?? "") ? (locale as AppLocale) : defaultLocale;

  return helpLinkDefinitions.map(({ keywords: _keywords, ...link }) => ({
    ...link,
    href: withLocalePrefix(link.href, normalizedLocale)
  }));
}

export function findHelpLinksForMessage(message: string, locale: string | undefined = defaultLocale) {
  const normalized = message.toLowerCase();
  const matched = helpLinkDefinitions.filter((link) =>
    link.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );

  const links = matched.length > 0 ? matched : helpLinkDefinitions.slice(0, 4);
  const normalizedLocale = isSupportedLocale(locale ?? "") ? (locale as AppLocale) : defaultLocale;

  return links.slice(0, 4).map(({ keywords: _keywords, ...link }) => ({
    ...link,
    href: withLocalePrefix(link.href, normalizedLocale)
  }));
}

function withLocalePrefix(path: string, locale: AppLocale) {
  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}
