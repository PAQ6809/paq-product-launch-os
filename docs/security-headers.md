# Security Headers

v0.4.9 在 `next.config.ts` 使用 Next.js `headers()` 加入基礎安全 headers。這是 production baseline，不取代 server-side auth、RLS、rate limit 或 provider fallback。

## Enabled Headers

所有 routes 套用：

```text
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Why These Headers

- `X-Frame-Options: DENY`：降低 clickjacking 風險。
- `X-Content-Type-Options: nosniff`：避免 browser 猜測錯誤 content type。
- `Referrer-Policy: strict-origin-when-cross-origin`：跨站只送 origin，減少 URL path 外洩。
- `Permissions-Policy`：PAQ 目前不需要 camera、microphone、geolocation，因此預設停用。

## CSP Roadmap

目前尚未加入 full Content-Security-Policy。原因：

1. Supabase Auth callback、Vercel preview domain、Next.js runtime 與未來 analytics 需要一起盤點。
2. 太早加入嚴格 CSP 容易擋到 auth flow 或 preview smoke。
3. 正式加入 CSP 前要先做 report-only 階段與 visual smoke。

建議下一步：

1. 盤點所有 script、style、image、connect 來源。
2. 先使用 `Content-Security-Policy-Report-Only`。
3. 確認 Supabase、NVIDIA/OpenAI server-side route、Vercel preview、local dev 都不被誤擋。
4. 再升級成 enforced CSP。

## Verification

本機或 production 可用：

```bash
curl -I https://YOUR-DOMAIN
```

應看到上述 headers。

## Security Boundaries

Headers 只是 defense-in-depth。以下仍由 app code 負責：

- `/api/generate-report` 檢查 login requirement、rate limit、provider fallback。
- Workspace APIs 從 session 取得 `user.id`，不可相信 client `user_id`。
- Supabase RLS 阻擋 cross-user access。
- Developer diagnostics 由 `requireDeveloper()` server-side 保護。
- Provider API key 與 encryption key 不回傳到 client。

## Source Notes

- Next.js headers config：https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- Next.js security guidance：https://nextjs.org/blog/security-nextjs-server-components-actions
- OWASP HTTP Headers Cheat Sheet：https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
