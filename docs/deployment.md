# Vercel Deployment

## 部署相容性摘要

PAQ Product Launch OS 使用 Next.js App Router，`app/api/generate-report/route.ts` 與 `app/api/translate-report/route.ts` 都明確使用 Node.js runtime，可由 Vercel Functions 執行。

- OpenAI、NVIDIA 與 translation provider 都以 `server-only` 保護，只有 API route 會載入 provider selector。
- localStorage helper 會先檢查 `typeof window !== "undefined"`，目前只由 `"use client"` 元件呼叫。
- `.env.local`、`.vercel`、Next.js 輸出與本機測試 log 都已由 `.gitignore` 排除。
- 公開 production demo 預設不需要任何真實 provider key。

## 從 GitHub 部署

1. 將目前分支推送到 GitHub repo。
2. 登入 Vercel，選擇 **Add New > Project**。
3. 在 **Import Git Repository** 選擇 `PAQ6809/paq-product-launch-os`。
4. Framework Preset 確認為 **Next.js**，Root Directory 保持 repo root。
5. Install Command 使用 `npm install`，Build Command 使用 `npm run build`。
6. 在 Environment Variables 加入下方的公開 demo 設定。
7. 按下 Deploy，完成後取得 production URL。
8. 依照 `docs/production-smoke-test.md` 完成部署後驗證。

Vercel 會在連結 Git repo 後為後續 push 建立 deployment。Production、Preview 與 Development 環境變數應分開設定；變更環境變數後要重新部署才會套用。

官方參考：

- [Vercel Git deployments](https://vercel.com/docs/deployments/git)
- [Vercel environment variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)

## Public Demo 建議設定

公開 production 使用 MockAIProvider，不放 OpenAI 或 NVIDIA key：

```env
AI_PROVIDER=mock
TRANSLATION_PROVIDER=mock
ENABLE_PUBLIC_REAL_AI=false
ENABLE_DEV_DIAGNOSTICS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=3600
RATE_LIMIT_MAX_REQUESTS=5
```

`OPENAI_API_KEY` 與 `NVIDIA_API_KEY` 不需要在公開 Mock Demo 建立。即使未來把 key 加到 Vercel，也不可使用 `NEXT_PUBLIC_` 前綴。

目前 rate limit 是 per-instance in-memory limiter。它可阻擋同一個 warm instance 的簡易濫用，但 cold start、重新部署或多個 Vercel instance 不共享計數。公開真 AI 前應先改用 Upstash Redis、Vercel Redis / KV 或 Supabase 的共享限額。

## Mock Mode 測試

Public Demo 設定完成後，送出一筆商品：

```powershell
$baseUrl = "https://YOUR-PROJECT.vercel.app"
$body = @{
  productName = "Deployment Smoke Product"
  category = "3C 配件"
  features = "輕薄、方便攜帶"
  cost = 500
  targetPrice = 1090
  targetAudience = "通勤族"
  brandStyle = "簡潔科技感"
  salesChannels = @("Shopify", "蝦皮")
  imageUrl = "/hero-workspace.png"
} | ConvertTo-Json

$result = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/generate-report" -ContentType "application/json" -Body $body
$result | Select-Object provider, requestedProvider, forcedMockInProduction, validationPassed, rateLimit
```

當 `AI_PROVIDER=mock` 時，預期 `provider=mock`、`requestedProvider=mock`、`validationPassed=true`。此時 `forcedMockInProduction=false` 是正常結果，因為沒有要求真 provider。

## OpenAI Mode 封閉測試

只在受 Vercel Authentication、應用登入或其他 access control 保護的 Preview deployment 測試：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-4.1-mini
ENABLE_PUBLIC_REAL_AI=true
ENABLE_DEV_DIAGNOSTICS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=2
```

重新部署後送出一筆商品。預期 `provider=openai`、`requestedProvider=openai`、`forcedMockInProduction=false`。若回傳 `provider=mock`，查看 `warning` 判斷是缺少 key、上游錯誤或 validator fallback。測試完成後立即把 `ENABLE_PUBLIC_REAL_AI` 改回 `false`，或刪除 Preview key。

## NVIDIA Mode 封閉測試

同樣只在受保護的 deployment 使用：

```env
AI_PROVIDER=nvidia
NVIDIA_API_KEY=your_server_side_key
NVIDIA_MODEL=minimaxai/minimax-m2.7
ENABLE_PUBLIC_REAL_AI=true
ENABLE_DEV_DIAGNOSTICS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=2
```

預期 `provider=nvidia`。若 Vercel Function timeout，先檢查 provider latency、目前 Vercel plan 的 function duration 上限與 `NVIDIA_TIMEOUT_MS`；不要為了通過測試而關閉 validation 或 fallback。

## Production Forced Mock 驗證

要驗證 safety gate，建立一個不含 provider key 的測試 deployment：

```env
AI_PROVIDER=openai
ENABLE_PUBLIC_REAL_AI=false
RATE_LIMIT_ENABLED=true
```

重新部署並呼叫 API，預期：

```text
provider=mock
requestedProvider=openai
isFallback=true
publicRealAIEnabled=false
forcedMockInProduction=true
```

測試後將公開 production 恢復成 `AI_PROVIDER=mock`。

## Rate Limit 驗證

先暫時把測試 deployment 設成：

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=2
```

重新部署後，從同一個網路連續呼叫三次 API。單一 warm instance 預期依序為 HTTP `200 / 200 / 429`；429 body 應包含 `RATE_LIMIT_EXCEEDED`、`retryAfterSeconds` 與 `resetAt`。

Vercel 可能把請求分派到不同 instance，因此 in-memory 測試不保證每次都能在 production 重現 429。正式 quota 必須換成共享儲存。

## 常見錯誤排查

| 現象 | 檢查方式 |
| --- | --- |
| Build 失敗 | 先在本機執行 `npm ci`、`npm run lint`、`npm run build`，確認 Vercel Root Directory 正確。 |
| API 回傳 404 | 確認 URL 為 `/api/generate-report`、method 為 POST，且最新 deployment 包含 route。 |
| 預期 OpenAI / NVIDIA 卻得到 mock | 查看 `requestedProvider` 與 `warning`，確認 key、provider 名稱及 `ENABLE_PUBLIC_REAL_AI=true`。 |
| Production 一直 forced mock | 這是 `ENABLE_PUBLIC_REAL_AI=false` 的預期保護；只在受保護測試環境開啟。 |
| API 回傳 429 | 等待 `retryAfterSeconds`，或在封閉測試 deployment 調整 window，不要直接停用 production 防護。 |
| NVIDIA / OpenAI timeout | 比較 provider timeout 與 Vercel Function duration，縮小測試內容或選擇較快模型。 |
| 重新整理後自建商品消失 | localStorage 只存在同一瀏覽器與同一網域；Preview URL 與 Production URL 不共享資料。 |
| Rate limit 沒有穩定回傳 429 | in-memory 計數未跨 instance 共享；正式環境改用 Redis / KV / Supabase。 |
