# PAQ v0.4 Auth 與 Product Workspace

PAQ Product Launch OS v0.4 加入 Supabase Auth 與登入後的雲端商品 workspace。公開 demo 仍可匿名使用：沒有登入、沒有 Supabase env，或 API route 回傳 401 時，前端會保留既有 localStorage demo flow。

## 架構

- Frontend：Next.js App Router、locale route `app/[locale]/*`、Supabase browser client。
- Server：Next.js API routes 使用 Supabase SSR server client 讀取 session。
- Middleware：根 middleware 先執行 `next-intl`，再透過 Supabase SSR refresh session cookie。
- Database：Supabase PostgreSQL + RLS。
- Auth pages：`/[locale]/login`、`/[locale]/signup`、`/[locale]/reset-password`。
- OAuth/email callback：`/auth/callback`，只接受安全的相對路徑 redirect。

## 環境變數

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 或舊版 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 可被前端使用。`SUPABASE_SERVICE_ROLE_KEY` 必須只放在 server-side 環境，v0.4 的一般產品、草稿、報告 API 不需要使用 service role。

## Session 驗證

所有 workspace API routes 都使用 server-side session，不接受前端傳入 `user_id`：

- `GET/POST /api/products`
- `GET/PATCH/DELETE /api/products/[id]`
- `GET/POST/DELETE /api/drafts`
- `GET/POST /api/reports`
- `POST /api/anonymous-draft/import`

未登入時回傳 401 與清楚訊息，前端會 fallback 到本機 demo/localStorage。

## RLS 原則

`docs/supabase-schema.sql` 啟用 RLS，並讓每張 workspace 表只能存取自己的資料：

- `profiles.id = auth.uid()`
- `products.user_id = auth.uid()`
- `product_drafts.user_id = auth.uid()`
- `launch_reports.user_id = auth.uid()`
- `report_translations.user_id = auth.uid()`
- `workspace_events.user_id = auth.uid()`

Supabase 官方文件建議 server-side auth 要避免只信任 cookie session；server API 需要透過 Supabase Auth 驗證 user。RLS 仍是最後一道資料隔離防線。

## Product Workspace 行為

匿名使用：

- 首頁、Dashboard、Demo 商品、商品輸入頁、報告頁都可用。
- 商品、報告、翻譯、草稿保存在 localStorage。
- API 回傳 401 不會破壞 demo flow。

登入使用：

- Dashboard 與商品歷史頁會嘗試讀取 `/api/products`。
- 商品送出時會先嘗試建立 Supabase product。
- 報告產生後會嘗試保存到 `launch_reports`。
- 本機資料仍保留，避免網路或 Supabase 設定問題造成資料遺失。

## 安全注意事項

- 不使用 NextAuth/Auth.js。
- 不自建 password hashing。
- 不把 Supabase auth token 放進 localStorage。
- 不在 client component import server-only provider 或 service role key。
- 不接受 client-supplied `user_id`。
- Service role key 不應出現在 browser bundle、README 範例值、console log 或 telemetry。

## 後續升級

- 加入 workspace/team model。
- 將 in-memory rate limit 升級成 Redis/Vercel KV/Supabase。
- 將 human review/audit log 從前端 state 寫入資料庫。
- 將 report translations 保存到 `report_translations` API route。
- 加入 per-user quota 與付費方案。

## 參考

- Supabase SSR Auth: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
