# Production Smoke Test

部署完成後，以 production URL 執行本清單。測試過程不可把 API key 貼到瀏覽器 console、request body、截圖或 issue。

## 基本頁面

- [ ] 首頁 `/` 回傳 HTTP 200，CTA 與三個 Demo 商品入口可見。
- [ ] Dashboard `/dashboard` 可開啟，商品名稱、類別、狀態與報告入口正常。
- [ ] Demo 報告 `/products/arc-snap-power-bank/report` 可開啟，Copy / Export 按鈕存在。
- [ ] 商品輸入頁 `/products/new` 可送出，完成後導向新商品報告。
- [ ] 重新整理後，使用者建立的商品與報告仍存在於同一網域的 localStorage。

## Generate Report API

- [ ] `POST /api/generate-report` 使用有效商品 payload 時回傳 HTTP 200。
- [ ] 公開 demo 設定下回傳 `provider=mock` 與 `validationPassed=true`。
- [ ] Response 包含 `rateLimit.enabled`、`rateLimit.remaining` 與 `rateLimit.resetAt`。
- [ ] Response headers 包含 `Cache-Control: no-store` 與 `X-RateLimit-*`。
- [ ] 無效 JSON 或缺少必要欄位時回傳 HTTP 400，server 不會 crash。

## Production Safety Gate

Safety gate 的專用測試 deployment 必須設定 `AI_PROVIDER=openai` 與 `ENABLE_PUBLIC_REAL_AI=false`，且不需要放 API key：

- [ ] 回傳 `provider=mock`。
- [ ] 回傳 `requestedProvider=openai`。
- [ ] 回傳 `publicRealAIEnabled=false`。
- [ ] 回傳 `forcedMockInProduction=true`。
- [ ] 回傳 `isFallback=true` 與明確 warning。

若公開 demo 本來就是 `AI_PROVIDER=mock`，`forcedMockInProduction=false` 是正確行為，不能把它誤判為 safety gate 失效。

## Rate Limit

在測試 deployment 暫設 `RATE_LIMIT_WINDOW_SECONDS=60`、`RATE_LIMIT_MAX_REQUESTS=2`：

- [ ] 同一 IP 前兩次請求回傳 HTTP 200。
- [ ] 同一 warm instance 的第三次請求回傳 HTTP 429。
- [ ] 429 body 包含 `error=RATE_LIMIT_EXCEEDED`、`retryAfterSeconds` 與 `resetAt`。
- [ ] 429 response 包含 `Retry-After` header。
- [ ] 超過限制時沒有啟動 OpenAI 或 NVIDIA provider。

In-memory limiter 不會跨 Vercel instance 共享。若請求被分配到不同 instance，429 可能無法穩定重現；這是目前 demo 架構的已知限制。

## Secret 與錯誤資訊

- [ ] Git repo 沒有追蹤 `.env.local`、`.vercel`、`*.log` 或真實 key。
- [ ] 瀏覽器 Network、HTML、JavaScript bundle 與 localStorage 中沒有 provider API key。
- [ ] Client component 沒有 import OpenAIProvider、NvidiaProvider 或 provider selector。
- [ ] Production error response 不包含完整上游 response、authorization header 或 stack trace。
- [ ] `ENABLE_DEV_DIAGNOSTICS=false`。

## Mobile

- [ ] 以 390 x 844 viewport 開啟首頁，導覽、CTA 與 Demo 商品不重疊。
- [ ] 商品輸入表單可輸入、捲動與送出。
- [ ] 報告 section、Copy / Export 與中英切換可操作。
- [ ] 頁面沒有水平溢出或截斷重要文字。

## 完成紀錄

```text
Deployment URL:
Git commit:
Tested at:
Tester:
Result: PASS / FAIL
Notes:
```
