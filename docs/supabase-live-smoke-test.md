# v0.4.7 Supabase Live Smoke Test

目標是在 merge main 前，確認 PAQ Product Launch OS 可以在真 Supabase env 下完成：

```txt
登入 → 建立產品 → autosave cloud draft → 生成報告 → 保存 report → Dashboard 歷史產品 → 登出再登入後恢復
```

## 1. 建立 Supabase Project

1. 到 Supabase Dashboard 建立新 project。
2. 在 Project Settings → API 複製：
   - Project URL
   - anon key 或 publishable key
3. 本階段不需要 `SUPABASE_SERVICE_ROLE_KEY`。一般 user workspace 操作必須走登入 session + RLS。

`.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

若專案使用新 publishable key，也可以改用：

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

不要把 `.env.local` commit。

## 2. 建立 Schema

1. 打開 Supabase SQL Editor。
2. 貼上並執行 `docs/supabase-schema.sql`。
3. 確認沒有 SQL error。

需要存在的 tables：

- `profiles`
- `products`
- `product_drafts`
- `launch_reports`
- `report_translations`
- `workspace_events`
- `export_jobs`
- `report_collections`
- `user_security_events`
- `data_requests`

## 3. 確認 RLS 與 Constraints

在 SQL Editor 執行：

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'products', 'product_drafts', 'launch_reports')
order by tablename;
```

每列 `rowsecurity` 都應為 `true`。

確認 draft upsert constraint：

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.product_drafts'::regclass
  and conname = 'product_drafts_user_draft_key_unique';
```

應看到：

```txt
unique (user_id, draft_key)
```

確認 lifecycle constraint：

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.products'::regclass
  and conname = 'products_lifecycle_status_check';
```

## 4. 建立測試帳號

建立兩個 email/password 測試帳號：

- user A：`paq-user-a+local@example.com`
- user B：`paq-user-b+local@example.com`

可用 app 的 `/zh-TW/signup` 建立，也可以在 Supabase Dashboard → Authentication → Users 建立。

## 5. User A End-to-End

1. 使用 user A 登入。
2. 到 `/zh-TW/products/new`。
3. 輸入商品資料，等待 autosave 顯示 `Saved to cloud`。
4. 重新整理頁面，確認可看到 cloud draft 恢復提示。
5. 點 `繼續編輯`，確認欄位回填。
6. 送出表單產生 report。
7. 確認進入 `/zh-TW/products/{id}/report`。
8. 到 `/zh-TW/dashboard`，確認商品出現在歷史列表。
9. 登出後重新登入 user A。
10. 再到 dashboard / report page，確認資料仍可讀回。

## 6. User B Isolation

1. 登入 user B。
2. 打開 `/zh-TW/dashboard`，確認看不到 user A 的產品。
3. 直接開 user A 的 product URL。
4. 預期結果：404 / missing state，不應顯示 user A 資料。
5. 直接開 user A 的 report URL。
6. 預期結果：404 / missing state，不應顯示 user A report。

API 直接測試：

```powershell
# 用 user B session cookie 呼叫 user A product id
curl.exe -i http://localhost:3000/api/products/<USER_A_PRODUCT_ID>
curl.exe -i "http://localhost:3000/api/reports?productId=<USER_A_PRODUCT_ID>"
```

預期：

- `GET /api/products/<USER_A_PRODUCT_ID>` 回 404。
- `GET /api/reports?productId=<USER_A_PRODUCT_ID>` 回 `report: null` 或不含 user A report。

## 7. Supabase 不可用 Fallback

移除 Supabase env 或暫時改名 `.env.local` 後測：

1. `npm run build` 不失敗。
2. `/zh-TW` 正常。
3. `/zh-TW/products/new` 可用 local draft。
4. `/zh-TW/products/arc-snap-power-bank/report` 正常。
5. `/zh-TW/dashboard` 顯示 local/demo fallback。
6. `/api/products`、`/api/drafts`、`/api/reports` 未登入時回 401，不 crash。

## 8. 合併前 Gate

```powershell
npm run i18n:check
npm run lint
npm run build
npm run test:visual
```

全部通過後，且 user A/B live isolation 通過，才 merge main。

## 9. 參考

- Supabase SSR client 需要 cookie-based server client；本專案使用 `@supabase/ssr` server client。
- Supabase RLS 是資料隔離的最後防線；public schema tables 必須啟用 RLS。
- Supabase 2026 Data API default grants 正在變更，新 project 若未自動 expose table，請確認 authenticated grants 與 Data API 設定。
