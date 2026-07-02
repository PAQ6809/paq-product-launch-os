# Workspace API Smoke Test

這份 checklist 用來驗證 v0.4.7 的 server-side workspace API。所有 route 都必須從 Supabase session 取得 `user.id`，不可相信 client 傳入的 `user_id`。

## 未登入

預期全部回 HTTP 401，且 response 不包含 secret、stack trace 或其他使用者資料。

```powershell
curl.exe -i http://localhost:3000/api/products
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d "{}"

curl.exe -i http://localhost:3000/api/drafts
curl.exe -i -X POST http://localhost:3000/api/drafts -H "Content-Type: application/json" -d "{}"

curl.exe -i "http://localhost:3000/api/reports?productId=demo"
curl.exe -i -X POST http://localhost:3000/api/reports -H "Content-Type: application/json" -d "{}"
```

Expected:

- `error: "AUTH_REQUIRED"`
- `Cache-Control: no-store`
- no `SUPABASE_SERVICE_ROLE_KEY`
- no `OPENAI_API_KEY`
- no `NVIDIA_API_KEY`
- no `nvapi-`
- no `sk-...`

## 已登入：Product

1. 使用瀏覽器登入 user A。
2. 建立 product：

```powershell
curl.exe -i -X POST http://localhost:3000/api/products `
  -H "Content-Type: application/json" `
  -d "{\"draft\":{\"name\":\"Smoke Product\",\"category\":\"文創小物\",\"features\":\"可測試保存\",\"cost\":\"120\",\"expectedPrice\":\"480\",\"targetAudience\":\"小品牌\",\"brandStyle\":\"乾淨可信任\",\"salesChannels\":\"Pinkoi, Shopify\"}}"
```

3. `GET /api/products` 應看得到該 product。
4. `PATCH /api/products/{id}` 可更新自己的 product。
5. `DELETE /api/products/{id}` 可 archive 自己的 product。

## 已登入：Draft

1. `POST /api/drafts`：

```json
{
  "draftKey": "smoke-draft-a",
  "formData": {
    "name": "Smoke Draft",
    "category": "文創小物",
    "features": "autosave smoke",
    "cost": "120",
    "expectedPrice": "480",
    "targetAudience": "小品牌",
    "brandStyle": "乾淨可信任",
    "salesChannels": "Pinkoi, Shopify"
  }
}
```

2. `GET /api/drafts` 應回 latest draft。
3. 連續送同一個 `draftKey` 3 次。
4. SQL 應只看到同一個 `user_id + draft_key` 一筆資料。

驗證 SQL：

```sql
select user_id, draft_key, count(*)
from public.product_drafts
where draft_key = 'smoke-draft-a'
group by user_id, draft_key;
```

每個 user 應為 `count = 1`。

## 已登入：Report

1. 先建立 product。
2. 呼叫 `POST /api/reports` 保存 report。
3. `GET /api/reports?productId=<productId>` 應回 latest report。
4. report row 的 `user_id` 應等於目前登入 user。

## 跨使用者隔離

User A：

1. 建立 product。
2. 保存 draft。
3. 保存 report。
4. 記下 product id。

User B：

1. 登入 user B。
2. `GET /api/products` 不應出現 user A product。
3. `GET /api/products/<USER_A_PRODUCT_ID>` 應 404。
4. `GET /api/reports?productId=<USER_A_PRODUCT_ID>` 應回 null / 空資料。
5. `GET /api/drafts` 不應回 user A draft。

## Atomic Upsert 對齊

SQL constraint：

```sql
constraint product_drafts_user_draft_key_unique unique (user_id, draft_key)
```

TypeScript conflict target：

```ts
.upsert(payload, { onConflict: "user_id,draft_key" })
```

這兩者必須完全一致。同一 user 的同一 draft key 會更新同一列；不同 user 可以使用相同 draft key，但 row 由 `user_id` 隔離。

目前行為：

- 同一 `user_id + draft_key`：更新同一列。
- 同一 `user_id + product_id` 但不同 `draft_key`：允許多筆，代表使用者可能有多個草稿來源。
- 若未來要限制一個 product 只保留一筆 active draft，需新增明確 `active` 欄位或 partial unique index。

## 合併前判定

可 merge main 的最低條件：

- 未登入 API 401 自動測試通過。
- local/demo fallback 在無 Supabase env 時不 crash。
- 有 Supabase env 時 user A end-to-end 通過。
- user B 無法讀 user A products / drafts / reports。
- `npm run i18n:check`
- `npm run lint`
- `npm run build`
- `npm run test:visual`
