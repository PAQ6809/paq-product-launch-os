# AI Help Audit Plan

v0.4.6 Help Center 只記錄必要 metadata，不保存完整使用者問題、完整對話、商品報告內容或 provider 原始回覆。

## Event Types

- `help_chat_asked`
- `help_chat_rate_limited`
- `help_chat_out_of_scope`
- `help_chat_fallback`

## Metadata Contract

每筆事件最多保存：

- `userId`：可為 `null`
- `scope`：`site_help`、`account_help`、`security_help` 或 `out_of_scope`
- `provider`：`mock` 或 `nvidia`
- `isFallback`
- `currentPath`
- `locale`
- `createdAt`

## Privacy Rules

- 不保存完整 message。
- 不保存完整 history。
- 不保存商品內容、報告內容、翻譯內容或匯出內容。
- 不保存 API key、token、cookie、密碼或原始 request headers。
- provider error 只在本機 diagnostics 模式下回傳簡短訊息，production 使用安全 fallback 文案。

## Production Upgrade Path

目前 `lib/help/help-audit.ts` 使用既有 security event helper，demo 階段採 best-effort。Production 可以升級為：

- durable queue retry
- workspace-level quota table
- dashboard audit viewer
- admin-only anomaly review
- retention policy and deletion workflow

這些升級不得改變核心原則：Help audit 只記錄操作 metadata，不記錄完整對話內容。
