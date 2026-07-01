# AI Help Center

v0.4.6 加入站內 AI Help Center，讓使用者可以詢問 PAQ Product Launch OS 的網站功能、商品企劃流程、報告匯出、翻譯、帳號與資料安全問題。

## Provider 架構

Help Center 使用獨立 provider，不與商品上市報告的 AI provider 混在一起。

- `MockHelpProvider`：沒有 key、production 未開放、或 provider 失敗時使用。
- `NvidiaHelpProvider`：server-side 呼叫 NVIDIA chat completions API。
- `getHelpProvider()`：根據 `HELP_AI_PROVIDER`、`ENABLE_PUBLIC_HELP_AI` 與 `NVIDIA_API_KEY` 選擇 provider。

前端永遠只呼叫 `POST /api/help-chat`，不直接呼叫 NVIDIA。

## 環境變數

```env
HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_HELP_AI=false
HELP_RATE_LIMIT_ENABLED=true
HELP_RATE_LIMIT_WINDOW_SECONDS=3600
HELP_RATE_LIMIT_MAX_REQUESTS=20
HELP_MAX_MESSAGES_PER_THREAD=20
NVIDIA_API_KEY=
NVIDIA_MODEL=minimaxai/minimax-m2.7
```

若要在封閉測試中啟用 NVIDIA Help：

```env
HELP_AI_PROVIDER=nvidia
ENABLE_PUBLIC_HELP_AI=true
NVIDIA_API_KEY=your_key
NVIDIA_MODEL=minimaxai/minimax-m2.7
```

公開 demo 預設應保持：

```env
HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_HELP_AI=false
```

## API Route

`POST /api/help-chat` 接收：

- `message`
- `history`
- `locale`
- `currentPath`

Route 會執行：

1. 讀取目前 session。
2. 依使用者或 IP 做 Help rate limit。
3. 執行 scope guard。
4. out-of-scope 問題直接固定拒答，不呼叫 NVIDIA。
5. 建立 knowledge base context 與 related links。
6. 若需要帳號內容，只提供最小摘要。
7. 呼叫 selected provider。
8. provider 失敗或驗證失敗時 fallback 到 MockHelpProvider。
9. 只記錄 metadata audit event，不保存完整對話。

詳細 audit metadata 契約見 `docs/help-audit-plan.md`。

## Scope Guard

Help Center 只回答：

- 網站功能
- 商品建立流程
- AI 報告
- 匯出格式
- 翻譯與 locale
- 帳號與資料保存
- 安全、隱私、RLS、encryption、audit

Provider 回傳的 `scope` 必須是 `site_help`、`account_help`、`security_help` 或 `out_of_scope`。安全、隱私、資料刪除、RLS、encryption、audit 與 API key 相關問題應使用 `security_help`，並保留合規提醒。

出界問題會固定回覆：

> 我目前只能協助 PAQ Product Launch OS 的網站功能、商品企劃流程、報告匯出、帳號與資料安全相關問題。你可以問我如何建立產品、產生報告、匯出檔案或恢復草稿。

## Rate Limit

第一版使用 in-memory rate limit：

- `HELP_RATE_LIMIT_WINDOW_SECONDS`
- `HELP_RATE_LIMIT_MAX_REQUESTS`
- key 為登入使用者 ID 或 IP。

這只適合本機與簡易 demo。Production 建議改為 Upstash Redis、Vercel KV 或 Supabase-backed quota table。

## 帳號資料摘要

如果問題涉及「我的歷史產品」、「我的草稿」、「我的匯出紀錄」：

- 未登入：提醒登入後可查看 workspace。
- 已登入：只提供 product count、latest draft exists、latest product updated at、recent export count。

Help 不會把完整商品資料、報告內容或私密對話塞進 prompt。

## 安全與法規回答

安全或法規相關回答需包含：

- 本產品提供合規導向設計，不構成法律意見。
- 正式商用仍需法務與資安審查。

食品、美妝、保健、醫療商品不得被翻成或改寫成療效宣稱，也不得保證銷售結果。

## UI

全站右下角顯示 `AI Help` 浮動按鈕。桌機為右側 drawer，手機為底部/全寬面板。對話只用 sessionStorage 短期保存，最多保存 `HELP_MAX_MESSAGES_PER_THREAD` 筆。

Help UI 文案使用 `messages/*.json` 的 `help.*` keys，避免硬編碼問號 fallback。Developer Console 與 diagnostics routes 不顯示 public Help widget，避免診斷頁被一般使用者助理入口混淆。

內建 quick prompts：

- 如何建立產品？
- 報告可以匯出哪些格式？
- 為什麼我需要登入？
- 草稿會自動保存嗎？
- 我的資料安全嗎？
- 如何建立多產品報告書？

## 測試建議

- 問「如何建立產品？」應回 site help。
- 問「報告可以匯出哪些格式？」應顯示匯出格式與 related links。
- 問「我的資料安全嗎？」應顯示安全與法規 disclaimer。
- 問「幫我推薦股票」應 out-of-scope，且不呼叫 NVIDIA。
- 沒有 `NVIDIA_API_KEY` 時應使用 MockHelpProvider。
- 超過 Help rate limit 應回 429。
- `/zh-TW/dev`、`/zh-TW/dev/ai-diagnostics`、`/zh-TW/dev/help-diagnostics` 不應顯示 Help widget。
