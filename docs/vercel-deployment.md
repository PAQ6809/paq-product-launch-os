# Vercel Deployment

此文件是 v0.4.9 production readiness 的部署手冊。目標是讓 main 可以安全部署到 Vercel，同時保留 mock fallback、登入限制、rate limit 與 Supabase workspace persistence。

## Import Project

1. 到 Vercel 建立 New Project。
2. Import GitHub repo：`PAQ6809/paq-product-launch-os`。
3. Framework Preset 選 `Next.js`。
4. Root Directory 使用 repo root。
5. Production Branch 設為 `main`。
6. Install Command：`npm install`。
7. Build Command：`npm run build`。

Vercel Git integration 會對 `main` 產生 Production deployment，其他 branch 產生 Preview deployment。

## Required Vercel Environment Variables

Production 至少設定：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

AI_PROVIDER=nvidia
NVIDIA_API_KEY=
NVIDIA_MODEL=minimaxai/minimax-m2.7
ENABLE_PUBLIC_REAL_AI=false
REAL_AI_REQUIRE_LOGIN=true
REAL_AI_RATE_LIMIT_ENABLED=true
REAL_AI_RATE_LIMIT_WINDOW_SECONDS=3600
REAL_AI_RATE_LIMIT_MAX_REQUESTS=5

HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_HELP_AI=false
HELP_RATE_LIMIT_ENABLED=true
HELP_RATE_LIMIT_WINDOW_SECONDS=3600
HELP_RATE_LIMIT_MAX_REQUESTS=20
HELP_MAX_MESSAGES_PER_THREAD=20

ENABLE_DEV_DIAGNOSTICS=false
ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION=false
```

若使用 OpenAI，改用：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

## Optional Server-only Variables

只有需要對應功能時才設定：

```env
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_MASTER_KEY=
ENCRYPTION_KEY_VERSION=v1
REQUIRE_ENCRYPTION_IN_PRODUCTION=true
EXPORT_RETENTION_HOURS=24
ENABLE_EXPORT_AUDIT_LOG=true
ENABLE_DATA_EXPORT=true
ENABLE_ACCOUNT_DELETE_REQUEST=true
```

`SUPABASE_SERVICE_ROLE_KEY` 不應用於一般 workspace user flow。產品、草稿、報告保存必須走使用者 session 與 RLS。

## Preview Policy

Preview 預設：

```env
AI_PROVIDER=mock
HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_REAL_AI=false
ENABLE_PUBLIC_HELP_AI=false
ENABLE_DEV_DIAGNOSTICS=false
ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION=false
```

若要測真 AI preview，請只套用到指定 branch，並維持：

```env
REAL_AI_REQUIRE_LOGIN=true
REAL_AI_RATE_LIMIT_ENABLED=true
REAL_AI_RATE_LIMIT_MAX_REQUESTS=5
```

## Pre-deploy Gates

部署前本機必跑：

```bash
npm run i18n:check
npm run lint
npm run build
npm run test:visual
```

也要確認：

```bash
git status
```

工作樹應乾淨，且 `.env.local` 不可出現在 tracked 或 staged files。

## Post-deploy Smoke

部署後依序測：

1. `/{locale}` 首頁載入。
2. `/zh-TW/login`、`/zh-TW/signup`、`/zh-TW/reset-password` 可用。
3. 登入後 Dashboard 可開啟。
4. `/zh-TW/products/new` 可建立產品並 autosave cloud draft。
5. 登入後可產生真 AI report。
6. `launch_reports` 有保存新 report。
7. 登出後呼叫 generate report 不消耗真 AI，應 mock/fallback 並帶 warning。
8. user B 看不到 user A products、drafts、reports。
9. `/zh-TW/dev` 對 public user 不顯示 diagnostics metadata。
10. Network response、HTML、bundle、console 不含 raw secret。

完整 checklist 見 `docs/production-smoke-checklist.md`。

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Build fails on Vercel | 確認 Node/Next.js dependency install 正常，Build Command 是 `npm run build`。 |
| Supabase auth redirects to localhost | 到 Supabase Auth URL Configuration 設 production Site URL 與 Additional Redirect URLs。 |
| Real AI always mock | 檢查 `requestedProvider`、`warning`、provider key、`REAL_AI_REQUIRE_LOGIN`、`ENABLE_PUBLIC_REAL_AI`。 |
| Production public request forced mock | 這是預期安全行為：`ENABLE_PUBLIC_REAL_AI=false`。 |
| Rate limit 429 | 檢查 `REAL_AI_RATE_LIMIT_*`，in-memory limiter 只適合 demo，production quota 應升級 Redis / Vercel KV / Supabase。 |
| Developer Console 404 | Production 需要 `ENABLE_DEV_DIAGNOSTICS=true`、`ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION=true`，且登入者 role 為 developer/admin。 |

## Source Notes

- Vercel Git deployments：https://vercel.com/docs/deployments/git
- Vercel environments：https://vercel.com/docs/deployments/environments
- Vercel environment variables：https://vercel.com/docs/environment-variables
