import { OUT_OF_SCOPE_HELP_ANSWER, guardHelpScope } from "@/lib/help/help-scope-guard";
import type { HelpAnswer, HelpProvider, HelpQuestionInput } from "@/lib/help/provider";

const complianceDisclaimer =
  "本產品提供合規導向設計，不構成法律意見。正式商用仍需法務與資安審查。";

export class MockHelpProvider implements HelpProvider {
  readonly name = "mock" as const;
  readonly model = "paq-help-mock-v1";

  async answerHelpQuestion(input: HelpQuestionInput): Promise<HelpAnswer> {
    const guard = guardHelpScope(input.message);

    return {
      answer: guard.allowed ? buildMockAnswer(input, guard.needsComplianceDisclaimer) : OUT_OF_SCOPE_HELP_ANSWER,
      scope: guard.scope,
      relatedLinks: input.relatedLinks,
      suggestedActions: buildSuggestedActions(input.message, guard.requiresAccountContext),
      provider: this.name,
      model: this.model,
      isFallback: false,
      answeredAt: new Date().toISOString()
    };
  }
}

function buildMockAnswer(input: HelpQuestionInput, needsComplianceDisclaimer: boolean) {
  const message = input.message.toLowerCase();
  const account = input.userContextSummary;
  const parts: string[] = [];

  if (message.includes("匯出") || message.includes("export")) {
    parts.push("報告目前可匯出 Markdown、JSON、HTML、CSV summary、ZIP package，以及 Shopify、Shopee、Pinkoi、Amazon、Etsy 可複製商品頁模板。PDF、DOCX、PPTX 目前是 roadmap。");
  } else if (message.includes("建立") || message.includes("產品") || message.includes("商品")) {
    parts.push("你可以到「建立商品企劃」輸入商品名稱、類別、功能、成本、售價、目標客群、品牌風格、銷售平台與圖片。送出後會走 server-side report API，沒有真 AI key 時會用 Mock 報告保留 demo flow。");
  } else if (message.includes("草稿") || message.includes("autosave")) {
    parts.push("商品輸入頁支援 autosave。匿名使用時先保存在本機；登入後可把匿名草稿匯入 workspace，避免重新填表。");
  } else if (message.includes("安全") || message.includes("隱私") || message.includes("資料")) {
    parts.push("第三方 AI key 只放在 server-side 環境變數，不會送到前端。登入後的 workspace 資料以 Supabase RLS 依 user_id 隔離，安全中心提供資料匯出與刪除請求入口。");
  } else if (message.includes("登入") || message.includes("帳號") || message.includes("歷史")) {
    parts.push(account?.isLoggedIn ? buildAccountSummary(account) : "匿名模式可以看 demo 與保留本機草稿；若要跨裝置保存商品、報告、匯出紀錄與多產品報告書，需要登入。");
  } else if (message.includes("collection") || message.includes("多產品") || message.includes("matrix")) {
    parts.push("多產品報告書可在 Report Collections 建立，把多個商品整理成一份 report collection，並用 Product Matrix 比較定位、價格、客群、上市狀態與風險。");
  } else {
    parts.push("我可以協助你理解 PAQ Product Launch OS 的商品建立流程、AI 報告、匯出格式、翻譯、帳號保存與安全設定。你可以直接問「如何建立產品？」或「報告可以匯出哪些格式？」。");
  }

  if (needsComplianceDisclaimer || message.includes("法律") || message.includes("法規")) {
    parts.push(complianceDisclaimer);
  }

  return parts.join("\n\n");
}

function buildAccountSummary(account: NonNullable<HelpQuestionInput["userContextSummary"]>) {
  return `你目前已登入。依照系統提供的最小摘要，你的 workspace 約有 ${account.productCount ?? 0} 個商品，最新草稿狀態：${account.latestDraftExists ? "有草稿" : "沒有可見草稿"}，最近匯出紀錄 ${account.recentExportCount ?? 0} 筆。若要查看完整內容，請到 Dashboard 或 Products 頁面。`;
}

function buildSuggestedActions(message: string, needsAccountContext: boolean) {
  if (needsAccountContext) {
    return ["前往 Dashboard", "查看產品列表", "檢查安全中心"];
  }

  if (message.includes("匯出") || message.toLowerCase().includes("export")) {
    return ["打開 Demo 報告頁", "使用 Export 按鈕群組", "確認法規提醒"];
  }

  return ["建立商品企劃", "查看 Demo 商品", "閱讀報告頁的法規提醒"];
}
