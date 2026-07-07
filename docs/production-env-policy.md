# Production Env Policy

PAQ Product Launch OS 的 production 原則是：公開 demo 預設安全，真 AI 僅給登入使用者，所有 secret 只存在 server-side 環境變數。

## Public Client Env

只有下列變數可以暴露到瀏覽器：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
```

`NEXT_PUBLIC_*` 會進入 client bundle，不可放 API key、service role、database secret、encryption key 或 provider token。

## Server-only Env

下列變數只能存在 `.env.local` 或 Vercel Environment Variables，不可 commit，也不可使用 `NEXT_PUBLIC_` 前綴：

```env
OPENAI_API_KEY=
NVIDIA_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_MASTER_KEY=
```

Developer Console 可以顯示 `configured: true/false`，但不得顯示原始值。

## Production Defaults

Production 建議值：

```env
AI_PROVIDER=nvidia
NVIDIA_MODEL=minimaxai/minimax-m2.7
ENABLE_PUBLIC_REAL_AI=false
REAL_AI_REQUIRE_LOGIN=true
REAL_AI_RATE_LIMIT_ENABLED=true
REAL_AI_RATE_LIMIT_WINDOW_SECONDS=3600
REAL_AI_RATE_LIMIT_MAX_REQUESTS=5

HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_HELP_AI=false

ENABLE_DEV_DIAGNOSTICS=false
ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION=false
REQUIRE_ENCRYPTION_IN_PRODUCTION=true
```

`ENABLE_PUBLIC_REAL_AI=false` 代表 production public request 即使設定真 provider，也會 forced mock。`REAL_AI_REQUIRE_LOGIN=true` 代表未登入使用者不消耗真 AI。

## Preview Defaults

Preview deployment 預設不接真 AI：

```env
AI_PROVIDER=mock
HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_REAL_AI=false
ENABLE_PUBLIC_HELP_AI=false
ENABLE_DEV_DIAGNOSTICS=false
ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION=false
```

需要封閉測試真 AI 時，請只在指定 preview branch 設定 provider key，並維持 `REAL_AI_REQUIRE_LOGIN=true`。

## Local Defaults

本機可用 mock 或真 provider：

```env
AI_PROVIDER=mock
HELP_AI_PROVIDER=mock
REAL_AI_REQUIRE_LOGIN=true
ENABLE_PUBLIC_REAL_AI=false
```

`.env.local` 必須保持 gitignored。若使用 `vercel env pull`，拉完後重新檢查 `.env.local` 沒有被 staged。

## Source Notes

- Vercel env 可分 Local Development、Preview、Production 三種環境：https://vercel.com/docs/deployments/environments
- Vercel Environment Variables 文件：https://vercel.com/docs/environment-variables
- Next.js 會把 `NEXT_PUBLIC_*` 變數暴露到 browser bundle：https://nextjs.org/docs/pages/guides/environment-variables
