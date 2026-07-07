# Production Smoke Checklist

部署到 Vercel 後，用這份 checklist 判斷 production 是否真的可用。不要只看 `npm run build`。

## Pre-deploy

- [ ] `git status` 乾淨。
- [ ] `.env.local` 未 tracked、未 staged。
- [ ] `npm run i18n:check` 通過。
- [ ] `npm run lint` 通過。
- [ ] `npm run build` 通過。
- [ ] `npm run test:visual` 通過。
- [ ] `.env.example` 只含空值或安全預設。
- [ ] repo 內沒有 raw API key、token、service role、encryption key。
- [ ] Supabase schema 已套用。
- [ ] RLS enabled，且沒有 `allow all` policy。

## Vercel Env

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已設定。
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已設定。
- [ ] `AI_PROVIDER` 已設定。
- [ ] `NVIDIA_API_KEY` 或 `OPENAI_API_KEY` 已設定在 server-side env。
- [ ] `REAL_AI_REQUIRE_LOGIN=true`。
- [ ] `ENABLE_PUBLIC_REAL_AI=false`，除非是封閉測試。
- [ ] `REAL_AI_RATE_LIMIT_ENABLED=true`。
- [ ] `HELP_AI_PROVIDER=mock` 或已明確核准 `nvidia`。
- [ ] `ENABLE_PUBLIC_HELP_AI=false`。
- [ ] `ENABLE_DEV_DIAGNOSTICS=false`。
- [ ] `ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION=false`。
- [ ] `ENCRYPTION_MASTER_KEY` 已依 production encryption 策略設定或確認功能不需啟用。

## Supabase Auth

- [ ] Site URL 是 production domain。
- [ ] Additional Redirect URLs 包含 production `/auth/callback`。
- [ ] Additional Redirect URLs 包含 local smoke `/auth/callback`。
- [ ] Email confirmation link 不導回 localhost。
- [ ] Reset password link 不導回 localhost。
- [ ] 不產生 `/zh-TW/zh-TW` 類型重複 locale。
- [ ] Production 已評估 custom SMTP。

## Public Pages

- [ ] `/zh-TW` 回 200。
- [ ] `/zh-TW/login` 回 200。
- [ ] `/zh-TW/signup` 回 200。
- [ ] `/zh-TW/reset-password` 回 200。
- [ ] Demo report page 可開啟。
- [ ] 390x844、768x1024、1440x900 無 horizontal overflow。
- [ ] HTML 不含 `??` 或 replacement character。

## Authenticated Workspace

- [ ] user A signup/login 成功。
- [ ] user A 建立 product。
- [ ] `/zh-TW/products/new` autosave 顯示 cloud saved。
- [ ] refresh 後可恢復 cloud draft。
- [ ] user A 產生 report。
- [ ] report 保存到 `launch_reports`。
- [ ] Dashboard 顯示 user A 歷史產品。
- [ ] 登出再登入後資料仍存在。

## User Isolation

- [ ] user B Dashboard 看不到 user A product。
- [ ] user B `/zh-TW/products/new` 不恢復 user A draft。
- [ ] user B 直接開 user A product URL 會 403、404 或 safe redirect。
- [ ] user B 直接開 user A report URL 會 403、404 或 safe redirect。
- [ ] API response 不含其他使用者資料。

## Real AI Safety

- [ ] 登入後生成 report，metadata 顯示 `requestedProvider=nvidia` 或 `openai`。
- [ ] 真 AI 成功時 `isFallback=false`、`validationPassed=true`、`model` 有值。
- [ ] 未登入呼叫 generate report 不消耗真 AI。
- [ ] Production 且 `ENABLE_PUBLIC_REAL_AI=false` 時 public request forced mock。
- [ ] response 有 `rateLimit` metadata。
- [ ] rate limit 超過時回 429，且有 `Retry-After`。

## Developer And Help Safety

- [ ] Public user 不能看到 `/zh-TW/dev` diagnostics metadata。
- [ ] `/zh-TW/dev/ai-diagnostics` 不顯示 raw keys。
- [ ] `/zh-TW/dev/help-diagnostics` 不顯示 raw keys。
- [ ] Developer diagnostics 只顯示 configured true/false。
- [ ] Public Help widget 不出現在 dev diagnostics pages。
- [ ] Help Chat out-of-scope 問題不呼叫真 provider。

## Secret Leak Check

- [ ] HTML 不含 `OPENAI_API_KEY`、`NVIDIA_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`ENCRYPTION_MASTER_KEY` 的值。
- [ ] Network response 不含 raw `nvapi-`、`sk-`、service role、cookie、session token。
- [ ] Browser bundle 不含 provider API key。
- [ ] Vercel logs 不輸出 raw request body、Authorization、cookie 或 env dump。

## Result

```text
Deployment URL:
Git commit:
Tested at:
Tester:
Result: PASS / FAIL
Notes:
```
