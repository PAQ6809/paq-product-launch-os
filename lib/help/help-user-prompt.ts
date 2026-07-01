import type { HelpQuestionInput } from "@/lib/help/provider";

export function buildHelpUserPrompt(input: HelpQuestionInput) {
  const safeHistory = input.history
    .slice(-6)
    .map((message) => `${message.role}: ${message.content.slice(0, 500)}`)
    .join("\n");

  return `
使用者目前頁面：${input.currentPath ?? "unknown"}
語系：${input.locale}
使用者問題：
${input.message}

最近對話摘要：
${safeHistory || "none"}

可用產品知識庫：
${input.knowledgeBaseContext}

相關連結候選：
${input.relatedLinks.map((link) => `- ${link.label}: ${link.href} (${link.description ?? ""})`).join("\n")}

最小帳號摘要：
${JSON.stringify(input.userContextSummary ?? { isLoggedIn: Boolean(input.userId) })}

請優先使用「語系」欄位指定的語言回答；如果語系不是你能穩定產出的語言，請使用繁體中文。回答要具體、短而可操作，並保留上方 JSON 格式。
`.trim();
}
