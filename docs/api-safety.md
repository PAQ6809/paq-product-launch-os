# API Safety / Rate Limit / Quota

## 安全目標

`POST /api/generate-report` 是唯一可啟動商品報告生成的公開入口。OpenAI 與 NVIDIA API key 只能存放在 server-side 環境變數，不可寫入程式碼、送到瀏覽器、存入 localStorage，或使用 `NEXT_PUBLIC_` 前綴。

前端只傳送商品資料到本站 API route。API route 再選擇 provider、驗證回傳格式並處理 fallback。這可避免使用者從瀏覽器原始碼或網路請求中取得 provider key，也讓 rate limit、內容驗證與風險控制集中在同一個信任邊界。

## Rate Limit 架構

目前版本使用 `lib/security/rate-limit.ts` 的 in-memory fixed-window limiter：

- key：`generate-report:<client-ip>`；無法取得 IP 時使用 `anonymous`。
- window：`RATE_LIMIT_WINDOW_SECONDS`，預設 3600 秒。
- 上限：`RATE_LIMIT_MAX_REQUESTS`，預設每個 window 5 次。
- 開關：`RATE_LIMIT_ENABLED=true`。
- API 成功時回傳剩餘次數與重置時間，也會設定 `X-RateLimit-*` headers。
- 超過限制時回傳 HTTP 429、`RATE_LIMIT_EXCEEDED`、重試秒數與重置時間。

IP 依序讀取 `x-forwarded-for`、`x-real-ip` 與 runtime 提供的 `request.ip`。Forwarded headers 只有在 Vercel或受信任 reverse proxy 會覆寫這些 headers 時才可信；直接公開自架 Node server 時，使用者可能偽造 header，因此不能把 IP 當成登入身分或付費授權依據。

## In-memory 限制

目前 limiter 只適合本機、單一 process 與低流量 demo：

- Server restart、cold start 或重新部署後計數會消失。
- 多個 serverless instance 不共享計數，總請求量可能超過設定值。
- 無法提供跨區域一致性、正式帳號 quota 或可靠的計費紀錄。

Production 應改用具備原子遞增與 TTL 的共享儲存，例如 Upstash Redis、Vercel Marketplace 的 Redis / KV 方案，或 Supabase PostgreSQL。登入完成後，rate-limit key 應優先改用 `userId` 或 workspace ID，IP 只作為匿名請求的輔助限制。

## Public Real AI 保護

`ENABLE_PUBLIC_REAL_AI=false` 是公開 demo 的預設安全閘門：

- 在 production 中，即使 `AI_PROVIDER=openai` 或 `AI_PROVIDER=nvidia`，API 仍強制使用 `MockAIProvider`。
- 回傳 metadata 會包含 `publicRealAIEnabled: false` 與 `forcedMockInProduction: true`。
- development 不受此 production gate 限制，方便本機封閉測試。

只有在已設定共享 rate limit、成本告警、使用者驗證與可接受的預算上限後，才應在 production 設定 `ENABLE_PUBLIC_REAL_AI=true`。

## 安全開放封閉測試

1. 在 Vercel Preview 或受保護的 production deployment 設定 provider key。
2. 將 `AI_PROVIDER` 設為 `openai` 或 `nvidia`。
3. 保持較低的 `RATE_LIMIT_MAX_REQUESTS`，並確認 provider 帳戶有預算或用量告警。
4. 確認測試網址有 Vercel Authentication、應用登入或其他 access control。
5. 最後才設定 `ENABLE_PUBLIC_REAL_AI=true`，測完立即關閉。

`ENABLE_DEV_DIAGNOSTICS=true` 只應用於本機 development。Production API 不回傳底層 provider 錯誤，避免洩漏模型、上游服務或內部實作資訊。

## 未來 Quota 架構

正式登入與付費方案可在現有 helper 後方加入共享 quota service：依 user、workspace 與方案計算每月額度；每次生成以原子操作扣除；將 provider、model、token、成本、fallback 與 request ID 寫入 `ai_generation_logs`。Rate limit 處理短時間濫用，monthly quota 處理方案用量，兩者應分開計算。
