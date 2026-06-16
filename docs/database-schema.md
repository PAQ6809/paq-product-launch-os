# PAQ Product Launch OS 資料庫 Schema

本文件根據 `docs/architecture.md` 設計 PAQ Product Launch OS 的 MVP 資料庫 schema。目標是支援商品資料輸入、AI 生成紀錄、上市報告、包裝 brief、商品頁文案、定價策略、社群素材、客服內容、生命週期任務、審核與 audit log。

第一版正式環境以 Supabase PostgreSQL 為主。本文件只提供 schema 設計、SQL 草案與 Prisma schema 草案，不實作資料庫連線、不建立 migration、不連 Supabase。

## 設計原則

- 使用 lowercase snake_case table/column，避免 Postgres quoted identifier 問題。
- `users.id` 使用 Supabase Auth 的 `auth.users.id` UUID。
- 其他主表使用 `bigint generated always as identity`，符合單一資料庫下的高效主鍵策略。
- 所有外鍵欄位都建立 index，避免 JOIN、RLS 與 cascade 操作變慢。
- 金額使用 `numeric(12,2)`，避免 float 精度問題。
- 時間使用 `timestamptz`。
- JSON 結構化但不固定的內容使用 `jsonb`，必要時加 GIN index。
- 多租戶資料以 `owner_user_id` 做 RLS 隔離；RLS policy 使用 `(select auth.uid())`，避免每列重複呼叫 auth function。
- AI 生成內容不可直接視為通過審核內容；需要保留 `review_status`、`risk_level`、`approved_at` 等欄位。

## Enum 設計

### 商品生命週期狀態 enum

```text
idea
research
positioning
packaging
listing
marketing
launched
optimizing
archived
```

### 其他建議 enum

- `review_status`：`pending_review`、`edited`、`approved`、`rejected`
- `risk_level`：`low`、`medium`、`high`
- `generation_status`：`queued`、`running`、`succeeded`、`failed`
- `asset_type`：`ig_post`、`threads_post`、`tiktok_caption`、`ad_copy`、`banner_copy`、`email_copy`、`canva_brief`
- `task_status`：`todo`、`in_progress`、`blocked`、`done`、`skipped`
- `audit_action`：`create`、`update`、`delete`、`generate`、`approve`、`reject`、`export`

## Tables

### 1. users

使用者 profile 表，對應 Supabase Auth user。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `uuid` | no | 對應 `auth.users.id` |
| `email` | `text` | no | 使用者 email，來自 auth profile |
| `display_name` | `text` | yes | 顯示名稱 |
| `avatar_url` | `text` | yes | 使用者頭像 |
| `default_brand_style` | `text` | yes | 預設品牌語氣 |
| `settings` | `jsonb` | no | 使用者偏好，預設 `{}` |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- Primary key：`id`
- Unique index：`email`
- GIN index：`settings` 若未來常用 JSON containment 查詢

Relation 關係：
- `users.id` 1:N `products.owner_user_id`
- `users.id` 1:N `audit_logs.actor_user_id`

RLS / 權限注意事項：
- 使用者只能讀寫自己的 profile：`id = (select auth.uid())`
- `email` 不應被其他使用者查詢
- service role 可用於後台同步 auth profile，但不能暴露到前端

### 2. products

商品專案主表。此表代表一個商品上市工作單位，不代表已上架平台商品。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `name` | `text` | no | 商品名稱 |
| `category` | `text` | no | 商品類別 |
| `lifecycle_status` | `product_lifecycle_status` | no | 商品生命週期狀態 |
| `stage_notes` | `text` | yes | 當前階段備註 |
| `features` | `text` | yes | 商品功能與特色 |
| `cost` | `numeric(12,2)` | yes | 成本 |
| `expected_price` | `numeric(12,2)` | yes | 預計售價 |
| `currency` | `text` | no | 幣別，預設 `TWD` |
| `target_audience` | `text` | yes | 目標客群 |
| `brand_style` | `text` | yes | 品牌風格 |
| `sales_platforms` | `text[]` | no | 目標平台，例如 Shopify、蝦皮、Pinkoi |
| `specs` | `jsonb` | no | 商品規格 |
| `usage_notes` | `text` | yes | 使用方式 |
| `warnings` | `text` | yes | 注意事項、警語 |
| `metadata` | `jsonb` | no | 延伸資料 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |
| `archived_at` | `timestamptz` | yes | 封存時間 |

Index 建議：
- `products_owner_user_id_idx` on `owner_user_id`
- `products_owner_status_idx` on `(owner_user_id, lifecycle_status)`
- `products_created_at_idx` on `(created_at desc)`
- GIN index：`specs`、`metadata`，若常做 JSON 查詢

Relation 關係：
- N:1 `products.owner_user_id` -> `users.id`
- 1:N `product_images`
- 1:N `market_research_reports`
- 1:N `competitor_products`
- 1:N `launch_reports`
- 1:N `packaging_briefs`
- 1:N `listing_copies`
- 1:N `pricing_strategies`
- 1:N `marketing_assets`
- 1:N `social_posts`
- 1:N `video_scripts`
- 1:N `customer_faqs`
- 1:N `customer_service_scripts`
- 1:N `lifecycle_tasks`
- 1:N `audit_logs`
- 1:N `ai_generation_logs`

RLS / 權限注意事項：
- 使用者只能讀寫自己的 product：`owner_user_id = (select auth.uid())`
- 未來團隊版要改為 owner/team membership policy
- `archived_at` 不代表刪除；預設列表應排除 archived 狀態

### 3. product_images

商品圖片 metadata。MVP 可先存 mock URL；未來接 Supabase Storage 或 Cloudflare R2。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者，方便 RLS |
| `storage_provider` | `text` | no | `mock`、`supabase_storage`、`r2` |
| `bucket_name` | `text` | yes | storage bucket |
| `object_path` | `text` | yes | storage object path |
| `public_url` | `text` | yes | 預覽 URL 或 mock URL |
| `file_name` | `text` | yes | 原始檔名 |
| `mime_type` | `text` | yes | MIME type |
| `file_size_bytes` | `bigint` | yes | 檔案大小 |
| `width` | `integer` | yes | 圖片寬度 |
| `height` | `integer` | yes | 圖片高度 |
| `sort_order` | `integer` | no | 排序 |
| `alt_text` | `text` | yes | 圖片替代文字 |
| `created_at` | `timestamptz` | no | 建立時間 |

Index 建議：
- `product_images_product_id_idx` on `product_id`
- `product_images_owner_user_id_idx` on `owner_user_id`
- `product_images_product_sort_idx` on `(product_id, sort_order)`

Relation 關係：
- N:1 `product_images.product_id` -> `products.id`
- N:1 `product_images.owner_user_id` -> `users.id`

RLS / 權限注意事項：
- 使用者只能讀寫自己的圖片 metadata
- Storage bucket 也要設定對應 policy，不能只保護資料表
- 未來上傳要限制 MIME type、檔案大小與私有 bucket 存取

### 4. market_research_reports

市場與競品研究報告。MVP 可以是 AI 根據使用者輸入生成的初稿；未來可接 source-backed research。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `title` | `text` | no | 報告標題 |
| `market_summary` | `text` | yes | 市場摘要 |
| `target_audience_analysis` | `text` | yes | 目標客群分析 |
| `competitor_summary` | `text` | yes | 競品摘要 |
| `source_notes` | `text` | yes | 來源與限制說明 |
| `sources` | `jsonb` | no | 來源列表，MVP 可為空陣列 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `review_status` | `review_status` | no | 審核狀態 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `market_research_reports_product_id_idx` on `product_id`
- `market_research_reports_owner_user_id_idx` on `owner_user_id`
- `market_research_reports_review_idx` on `(owner_user_id, review_status)`
- GIN index：`sources` 若未來查來源 URL/domain

Relation 關係：
- N:1 `market_research_reports.product_id` -> `products.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 若內容使用外部來源，要避免儲存過量受版權保護原文
- 未經 source-backed 查證時，`source_notes` 要清楚標示限制

### 5. competitor_products

競品資料。來源可由使用者手動輸入或未來 research workflow 產生。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `name` | `text` | no | 競品名稱 |
| `brand_name` | `text` | yes | 競品品牌 |
| `url` | `text` | yes | 競品連結 |
| `platform` | `text` | yes | 來源平台 |
| `price` | `numeric(12,2)` | yes | 競品價格 |
| `currency` | `text` | no | 幣別 |
| `positioning_notes` | `text` | yes | 定位觀察 |
| `strengths` | `text` | yes | 競品優勢 |
| `weaknesses` | `text` | yes | 競品弱點 |
| `evidence` | `jsonb` | no | 來源證據與擷取摘要 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `competitor_products_product_id_idx` on `product_id`
- `competitor_products_owner_user_id_idx` on `owner_user_id`
- `competitor_products_platform_idx` on `(product_id, platform)`
- `competitor_products_url_idx` on `url`，可視需要做 partial unique
- GIN index：`evidence`

Relation 關係：
- N:1 `competitor_products.product_id` -> `products.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- URL 欄位需要應用層驗證，避免未來 SSRF 類風險
- 不要把競品頁面大量原文完整保存

### 6. launch_reports

完整商品上市報告主表，統整其他區塊與生成版本。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `version` | `integer` | no | 報告版本 |
| `title` | `text` | no | 報告標題 |
| `executive_summary` | `text` | yes | 總結 |
| `positioning` | `text` | yes | 商品定位 |
| `core_selling_points` | `jsonb` | no | 核心賣點 |
| `checklist` | `jsonb` | no | 上架檢查清單 |
| `first_month_plan` | `jsonb` | no | 首月行銷計畫 |
| `optimization_advice` | `text` | yes | 銷售後優化建議 |
| `review_status` | `review_status` | no | 審核狀態 |
| `risk_level` | `risk_level` | no | 報告整體風險 |
| `approved_at` | `timestamptz` | yes | 通過時間 |
| `exported_at` | `timestamptz` | yes | 最近匯出時間 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `launch_reports_product_id_idx` on `product_id`
- `launch_reports_owner_user_id_idx` on `owner_user_id`
- Unique index：`(product_id, version)`
- `launch_reports_review_idx` on `(owner_user_id, review_status)`

Relation 關係：
- N:1 `launch_reports.product_id` -> `products.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 匯出前應檢查高風險區塊是否仍未審核
- 未來若有公開分享連結，應另建 share token 表，不要放寬本表 RLS

### 7. packaging_briefs

包裝設計 brief 與包裝正反面文案。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `launch_report_id` | `bigint` | yes | 對應報告版本 |
| `design_direction` | `text` | yes | 設計方向 |
| `visual_keywords` | `text[]` | no | 視覺關鍵字 |
| `front_copy` | `text` | yes | 包裝正面文案 |
| `back_copy` | `text` | yes | 包裝背面文案 |
| `required_elements` | `jsonb` | no | 必須出現的元素 |
| `avoid_elements` | `jsonb` | no | 避免元素 |
| `production_notes` | `text` | yes | 印刷與製作備註 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `review_status` | `review_status` | no | 審核狀態 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `packaging_briefs_product_id_idx` on `product_id`
- `packaging_briefs_launch_report_id_idx` on `launch_report_id`
- `packaging_briefs_owner_user_id_idx` on `owner_user_id`
- GIN index：`required_elements`、`avoid_elements` 若常查

Relation 關係：
- N:1 `packaging_briefs.product_id` -> `products.id`
- N:1 `packaging_briefs.launch_report_id` -> `launch_reports.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 包裝文案與圖像建議涉及商標、食品、美妝、醫療、保健風險時不可預設通過

### 8. listing_copies

商品頁文案，包括標題、短描述、長描述、規格表與 SEO 關鍵字。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `launch_report_id` | `bigint` | yes | 對應報告版本 |
| `platform` | `text` | no | 適用平台 |
| `title` | `text` | no | 商品頁標題 |
| `short_description` | `text` | yes | 短描述 |
| `long_description` | `text` | yes | 長描述 |
| `spec_table` | `jsonb` | no | 商品規格表 |
| `seo_keywords` | `text[]` | no | SEO 關鍵字 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `review_status` | `review_status` | no | 審核狀態 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `listing_copies_product_id_idx` on `product_id`
- `listing_copies_launch_report_id_idx` on `launch_report_id`
- `listing_copies_owner_platform_idx` on `(owner_user_id, platform)`
- GIN index：`seo_keywords`、`spec_table`

Relation 關係：
- N:1 `listing_copies.product_id` -> `products.id`
- N:1 `listing_copies.launch_report_id` -> `launch_reports.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 平台限制字詞與高風險功效宣稱需要人工審核

### 9. pricing_strategies

定價策略與毛利假設。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `launch_report_id` | `bigint` | yes | 對應報告版本 |
| `cost` | `numeric(12,2)` | yes | 成本 |
| `suggested_price` | `numeric(12,2)` | yes | 建議售價 |
| `floor_price` | `numeric(12,2)` | yes | 最低可接受價格 |
| `premium_price` | `numeric(12,2)` | yes | 高價策略價格 |
| `currency` | `text` | no | 幣別 |
| `gross_margin_rate` | `numeric(5,2)` | yes | 毛利率百分比 |
| `pricing_rationale` | `text` | yes | 定價理由 |
| `assumptions` | `jsonb` | no | 成本、平台費、物流、廣告假設 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `review_status` | `review_status` | no | 審核狀態 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `pricing_strategies_product_id_idx` on `product_id`
- `pricing_strategies_launch_report_id_idx` on `launch_report_id`
- `pricing_strategies_owner_user_id_idx` on `owner_user_id`

Relation 關係：
- N:1 `pricing_strategies.product_id` -> `products.id`
- N:1 `pricing_strategies.launch_report_id` -> `launch_reports.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 定價是商業假設，不是財務建議；應預設至少 `medium` risk

### 10. marketing_assets

行銷素材主表，可包含不同渠道素材、Canva brief、廣告文案等。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `launch_report_id` | `bigint` | yes | 對應報告版本 |
| `asset_type` | `asset_type` | no | 素材類型 |
| `title` | `text` | no | 素材標題 |
| `content` | `text` | yes | 素材內容 |
| `platform` | `text` | yes | 適用平台 |
| `format_notes` | `text` | yes | 格式備註 |
| `metadata` | `jsonb` | no | 延伸資料 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `review_status` | `review_status` | no | 審核狀態 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `marketing_assets_product_id_idx` on `product_id`
- `marketing_assets_launch_report_id_idx` on `launch_report_id`
- `marketing_assets_owner_type_idx` on `(owner_user_id, asset_type)`
- GIN index：`metadata`

Relation 關係：
- N:1 `marketing_assets.product_id` -> `products.id`
- N:1 `marketing_assets.launch_report_id` -> `launch_reports.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 未來若送 Canva 或外部工具，需記錄匯出事件與授權狀態

### 11. social_posts

IG、Threads、TikTok 等社群貼文文案。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `marketing_asset_id` | `bigint` | yes | 對應行銷素材 |
| `platform` | `text` | no | IG、Threads、TikTok 等 |
| `caption` | `text` | no | 貼文文案 |
| `hashtags` | `text[]` | no | hashtags |
| `call_to_action` | `text` | yes | CTA |
| `scheduled_for` | `timestamptz` | yes | 建議發布時間 |
| `review_status` | `review_status` | no | 審核狀態 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `social_posts_product_id_idx` on `product_id`
- `social_posts_marketing_asset_id_idx` on `marketing_asset_id`
- `social_posts_owner_platform_idx` on `(owner_user_id, platform)`
- `social_posts_scheduled_for_idx` on `scheduled_for`

Relation 關係：
- N:1 `social_posts.product_id` -> `products.id`
- N:1 `social_posts.marketing_asset_id` -> `marketing_assets.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- MVP 不自動發布社群；未來發布前必須 human approval

### 12. video_scripts

短影音腳本。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `marketing_asset_id` | `bigint` | yes | 對應行銷素材 |
| `platform` | `text` | yes | TikTok、Reels、Shorts 等 |
| `hook` | `text` | yes | 開頭 hook |
| `script_body` | `text` | no | 腳本內容 |
| `shot_list` | `jsonb` | no | 分鏡與畫面描述 |
| `duration_seconds` | `integer` | yes | 建議秒數 |
| `cta` | `text` | yes | CTA |
| `review_status` | `review_status` | no | 審核狀態 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `video_scripts_product_id_idx` on `product_id`
- `video_scripts_marketing_asset_id_idx` on `marketing_asset_id`
- `video_scripts_owner_user_id_idx` on `owner_user_id`
- GIN index：`shot_list`

Relation 關係：
- N:1 `video_scripts.product_id` -> `products.id`
- N:1 `video_scripts.marketing_asset_id` -> `marketing_assets.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 涉及功效、前後對比、廣告政策的腳本預設需要人工審核

### 13. customer_faqs

商品 FAQ。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `launch_report_id` | `bigint` | yes | 對應報告版本 |
| `question` | `text` | no | 問題 |
| `answer` | `text` | no | 回答 |
| `category` | `text` | yes | 分類，例如物流、使用、保固 |
| `sort_order` | `integer` | no | 排序 |
| `review_status` | `review_status` | no | 審核狀態 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `customer_faqs_product_id_idx` on `product_id`
- `customer_faqs_launch_report_id_idx` on `launch_report_id`
- `customer_faqs_product_sort_idx` on `(product_id, sort_order)`

Relation 關係：
- N:1 `customer_faqs.product_id` -> `products.id`
- N:1 `customer_faqs.launch_report_id` -> `launch_reports.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- FAQ 不可保證療效、保固或平台政策；高風險問答需人工確認

### 14. customer_service_scripts

客服回覆話術。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `scenario` | `text` | no | 情境，例如退貨、尺寸、使用方式 |
| `response_template` | `text` | no | 回覆模板 |
| `tone` | `text` | yes | 語氣 |
| `channel` | `text` | yes | 私訊、email、客服平台等 |
| `review_status` | `review_status` | no | 審核狀態 |
| `risk_level` | `risk_level` | no | 風險等級 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `customer_service_scripts_product_id_idx` on `product_id`
- `customer_service_scripts_owner_user_id_idx` on `owner_user_id`
- `customer_service_scripts_scenario_idx` on `(product_id, scenario)`

Relation 關係：
- N:1 `customer_service_scripts.product_id` -> `products.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 涉及退款、保固、醫療/保健建議的回覆要標記高風險

### 15. lifecycle_tasks

商品生命週期任務，例如完成包裝 brief、審核商品頁、準備首月社群素材。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `title` | `text` | no | 任務標題 |
| `description` | `text` | yes | 任務說明 |
| `lifecycle_status` | `product_lifecycle_status` | no | 對應生命週期階段 |
| `task_status` | `task_status` | no | 任務狀態 |
| `due_date` | `date` | yes | 到期日 |
| `completed_at` | `timestamptz` | yes | 完成時間 |
| `metadata` | `jsonb` | no | 延伸資料 |
| `created_at` | `timestamptz` | no | 建立時間 |
| `updated_at` | `timestamptz` | no | 更新時間 |

Index 建議：
- `lifecycle_tasks_product_id_idx` on `product_id`
- `lifecycle_tasks_owner_status_idx` on `(owner_user_id, task_status)`
- `lifecycle_tasks_due_date_idx` on `due_date`

Relation 關係：
- N:1 `lifecycle_tasks.product_id` -> `products.id`

RLS / 權限注意事項：
- 只允許 owner 讀寫
- 未來多人協作時可新增 assignee 與 team policy

### 16. audit_logs

重要操作紀錄，例如生成、審核、匯出、狀態變更。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `owner_user_id` | `uuid` | no | 資料擁有者 |
| `actor_user_id` | `uuid` | yes | 操作者，系統操作可為 null |
| `product_id` | `bigint` | yes | 相關商品 |
| `entity_table` | `text` | no | 受影響資料表 |
| `entity_id` | `bigint` | yes | 受影響資料 ID |
| `action` | `audit_action` | no | 操作類型 |
| `before_data` | `jsonb` | yes | 操作前資料摘要 |
| `after_data` | `jsonb` | yes | 操作後資料摘要 |
| `ip_address` | `inet` | yes | IP |
| `user_agent` | `text` | yes | User-Agent |
| `created_at` | `timestamptz` | no | 建立時間 |

Index 建議：
- `audit_logs_owner_user_id_idx` on `owner_user_id`
- `audit_logs_actor_user_id_idx` on `actor_user_id`
- `audit_logs_product_id_idx` on `product_id`
- `audit_logs_entity_idx` on `(entity_table, entity_id)`
- `audit_logs_created_at_idx` on `(created_at desc)`

Relation 關係：
- N:1 `audit_logs.owner_user_id` -> `users.id`
- N:1 `audit_logs.actor_user_id` -> `users.id`
- N:1 `audit_logs.product_id` -> `products.id`

RLS / 權限注意事項：
- 一般使用者可讀自己的 audit logs，但不應直接 update/delete
- 寫入應由 server/service role 執行
- 不要在 `before_data` / `after_data` 存 API key、token、完整敏感資料

### 17. ai_generation_logs

AI 生成紀錄，支援 debug、重跑、成本追蹤與 prompt version 管理。

| 欄位名稱 | 型別 | nullable | 說明 |
| --- | --- | --- | --- |
| `id` | `bigint` | no | 主鍵 |
| `product_id` | `bigint` | no | 所屬商品 |
| `owner_user_id` | `uuid` | no | 擁有者 |
| `target_table` | `text` | yes | 生成目標資料表 |
| `target_id` | `bigint` | yes | 生成目標 ID |
| `workflow_name` | `text` | no | workflow 名稱 |
| `workflow_version` | `text` | no | workflow 版本 |
| `provider` | `text` | no | `mock`、`openai`、`gemini` 等 |
| `model` | `text` | yes | 模型名稱 |
| `status` | `generation_status` | no | 生成狀態 |
| `input_snapshot` | `jsonb` | no | 輸入摘要，不放 secrets |
| `output_snapshot` | `jsonb` | yes | 輸出摘要 |
| `prompt_version` | `text` | yes | prompt 版本 |
| `error_message` | `text` | yes | 錯誤訊息 |
| `tokens_input` | `integer` | yes | input token |
| `tokens_output` | `integer` | yes | output token |
| `cost_usd` | `numeric(12,6)` | yes | 成本估算 |
| `latency_ms` | `integer` | yes | 耗時 |
| `created_at` | `timestamptz` | no | 建立時間 |

Index 建議：
- `ai_generation_logs_product_id_idx` on `product_id`
- `ai_generation_logs_owner_user_id_idx` on `owner_user_id`
- `ai_generation_logs_status_idx` on `(owner_user_id, status)`
- `ai_generation_logs_target_idx` on `(target_table, target_id)`
- `ai_generation_logs_created_at_idx` on `(created_at desc)`
- GIN index：`input_snapshot`、`output_snapshot` 若需要查 JSON

Relation 關係：
- N:1 `ai_generation_logs.product_id` -> `products.id`

RLS / 權限注意事項：
- 使用者可讀自己的生成紀錄摘要
- 寫入應由 server 執行
- 不要存 raw API key、完整 prompt secret、第三方 token
- 若未來 prompt/output 包含敏感商品資訊，需要 retention policy

## Supabase SQL Schema 草案

```sql
create extension if not exists pgcrypto;

create type product_lifecycle_status as enum (
  'idea',
  'research',
  'positioning',
  'packaging',
  'listing',
  'marketing',
  'launched',
  'optimizing',
  'archived'
);

create type review_status as enum (
  'pending_review',
  'edited',
  'approved',
  'rejected'
);

create type risk_level as enum (
  'low',
  'medium',
  'high'
);

create type generation_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed'
);

create type asset_type as enum (
  'ig_post',
  'threads_post',
  'tiktok_caption',
  'ad_copy',
  'banner_copy',
  'email_copy',
  'canva_brief'
);

create type task_status as enum (
  'todo',
  'in_progress',
  'blocked',
  'done',
  'skipped'
);

create type audit_action as enum (
  'create',
  'update',
  'delete',
  'generate',
  'approve',
  'reject',
  'export'
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  default_brand_style text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id bigint generated always as identity primary key,
  owner_user_id uuid not null references users(id) on delete cascade,
  name text not null,
  category text not null,
  lifecycle_status product_lifecycle_status not null default 'idea',
  stage_notes text,
  features text,
  cost numeric(12,2),
  expected_price numeric(12,2),
  currency text not null default 'TWD',
  target_audience text,
  brand_style text,
  sales_platforms text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,
  usage_notes text,
  warnings text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  storage_provider text not null default 'mock',
  bucket_name text,
  object_path text,
  public_url text,
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  width integer,
  height integer,
  sort_order integer not null default 0,
  alt_text text,
  created_at timestamptz not null default now()
);

create table market_research_reports (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  title text not null,
  market_summary text,
  target_audience_analysis text,
  competitor_summary text,
  source_notes text,
  sources jsonb not null default '[]'::jsonb,
  risk_level risk_level not null default 'medium',
  review_status review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table competitor_products (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  name text not null,
  brand_name text,
  url text,
  platform text,
  price numeric(12,2),
  currency text not null default 'TWD',
  positioning_notes text,
  strengths text,
  weaknesses text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table launch_reports (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  version integer not null default 1,
  title text not null,
  executive_summary text,
  positioning text,
  core_selling_points jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  first_month_plan jsonb not null default '[]'::jsonb,
  optimization_advice text,
  review_status review_status not null default 'pending_review',
  risk_level risk_level not null default 'medium',
  approved_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint launch_reports_product_version_unique unique (product_id, version)
);

create table packaging_briefs (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  launch_report_id bigint references launch_reports(id) on delete set null,
  design_direction text,
  visual_keywords text[] not null default '{}',
  front_copy text,
  back_copy text,
  required_elements jsonb not null default '[]'::jsonb,
  avoid_elements jsonb not null default '[]'::jsonb,
  production_notes text,
  risk_level risk_level not null default 'medium',
  review_status review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table listing_copies (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  launch_report_id bigint references launch_reports(id) on delete set null,
  platform text not null,
  title text not null,
  short_description text,
  long_description text,
  spec_table jsonb not null default '{}'::jsonb,
  seo_keywords text[] not null default '{}',
  risk_level risk_level not null default 'medium',
  review_status review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pricing_strategies (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  launch_report_id bigint references launch_reports(id) on delete set null,
  cost numeric(12,2),
  suggested_price numeric(12,2),
  floor_price numeric(12,2),
  premium_price numeric(12,2),
  currency text not null default 'TWD',
  gross_margin_rate numeric(5,2),
  pricing_rationale text,
  assumptions jsonb not null default '{}'::jsonb,
  risk_level risk_level not null default 'medium',
  review_status review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marketing_assets (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  launch_report_id bigint references launch_reports(id) on delete set null,
  asset_type asset_type not null,
  title text not null,
  content text,
  platform text,
  format_notes text,
  metadata jsonb not null default '{}'::jsonb,
  risk_level risk_level not null default 'low',
  review_status review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table social_posts (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  marketing_asset_id bigint references marketing_assets(id) on delete set null,
  platform text not null,
  caption text not null,
  hashtags text[] not null default '{}',
  call_to_action text,
  scheduled_for timestamptz,
  review_status review_status not null default 'pending_review',
  risk_level risk_level not null default 'low',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table video_scripts (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  marketing_asset_id bigint references marketing_assets(id) on delete set null,
  platform text,
  hook text,
  script_body text not null,
  shot_list jsonb not null default '[]'::jsonb,
  duration_seconds integer,
  cta text,
  review_status review_status not null default 'pending_review',
  risk_level risk_level not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customer_faqs (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  launch_report_id bigint references launch_reports(id) on delete set null,
  question text not null,
  answer text not null,
  category text,
  sort_order integer not null default 0,
  review_status review_status not null default 'pending_review',
  risk_level risk_level not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customer_service_scripts (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  scenario text not null,
  response_template text not null,
  tone text,
  channel text,
  review_status review_status not null default 'pending_review',
  risk_level risk_level not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lifecycle_tasks (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  lifecycle_status product_lifecycle_status not null,
  task_status task_status not null default 'todo',
  due_date date,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id bigint generated always as identity primary key,
  owner_user_id uuid not null references users(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  product_id bigint references products(id) on delete set null,
  entity_table text not null,
  entity_id bigint,
  action audit_action not null,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table ai_generation_logs (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete cascade,
  target_table text,
  target_id bigint,
  workflow_name text not null,
  workflow_version text not null,
  provider text not null default 'mock',
  model text,
  status generation_status not null default 'queued',
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb,
  prompt_version text,
  error_message text,
  tokens_input integer,
  tokens_output integer,
  cost_usd numeric(12,6),
  latency_ms integer,
  created_at timestamptz not null default now()
);

create index products_owner_user_id_idx on products (owner_user_id);
create index products_owner_status_idx on products (owner_user_id, lifecycle_status);
create index products_created_at_idx on products (created_at desc);
create index products_specs_gin_idx on products using gin (specs);
create index products_metadata_gin_idx on products using gin (metadata);

create index product_images_product_id_idx on product_images (product_id);
create index product_images_owner_user_id_idx on product_images (owner_user_id);
create index product_images_product_sort_idx on product_images (product_id, sort_order);

create index market_research_reports_product_id_idx on market_research_reports (product_id);
create index market_research_reports_owner_user_id_idx on market_research_reports (owner_user_id);
create index market_research_reports_review_idx on market_research_reports (owner_user_id, review_status);
create index market_research_reports_sources_gin_idx on market_research_reports using gin (sources);

create index competitor_products_product_id_idx on competitor_products (product_id);
create index competitor_products_owner_user_id_idx on competitor_products (owner_user_id);
create index competitor_products_platform_idx on competitor_products (product_id, platform);
create index competitor_products_url_idx on competitor_products (url);
create index competitor_products_evidence_gin_idx on competitor_products using gin (evidence);

create index launch_reports_product_id_idx on launch_reports (product_id);
create index launch_reports_owner_user_id_idx on launch_reports (owner_user_id);
create index launch_reports_review_idx on launch_reports (owner_user_id, review_status);

create index packaging_briefs_product_id_idx on packaging_briefs (product_id);
create index packaging_briefs_launch_report_id_idx on packaging_briefs (launch_report_id);
create index packaging_briefs_owner_user_id_idx on packaging_briefs (owner_user_id);

create index listing_copies_product_id_idx on listing_copies (product_id);
create index listing_copies_launch_report_id_idx on listing_copies (launch_report_id);
create index listing_copies_owner_platform_idx on listing_copies (owner_user_id, platform);
create index listing_copies_spec_table_gin_idx on listing_copies using gin (spec_table);

create index pricing_strategies_product_id_idx on pricing_strategies (product_id);
create index pricing_strategies_launch_report_id_idx on pricing_strategies (launch_report_id);
create index pricing_strategies_owner_user_id_idx on pricing_strategies (owner_user_id);

create index marketing_assets_product_id_idx on marketing_assets (product_id);
create index marketing_assets_launch_report_id_idx on marketing_assets (launch_report_id);
create index marketing_assets_owner_type_idx on marketing_assets (owner_user_id, asset_type);
create index marketing_assets_metadata_gin_idx on marketing_assets using gin (metadata);

create index social_posts_product_id_idx on social_posts (product_id);
create index social_posts_marketing_asset_id_idx on social_posts (marketing_asset_id);
create index social_posts_owner_platform_idx on social_posts (owner_user_id, platform);
create index social_posts_scheduled_for_idx on social_posts (scheduled_for);

create index video_scripts_product_id_idx on video_scripts (product_id);
create index video_scripts_marketing_asset_id_idx on video_scripts (marketing_asset_id);
create index video_scripts_owner_user_id_idx on video_scripts (owner_user_id);
create index video_scripts_shot_list_gin_idx on video_scripts using gin (shot_list);

create index customer_faqs_product_id_idx on customer_faqs (product_id);
create index customer_faqs_launch_report_id_idx on customer_faqs (launch_report_id);
create index customer_faqs_product_sort_idx on customer_faqs (product_id, sort_order);

create index customer_service_scripts_product_id_idx on customer_service_scripts (product_id);
create index customer_service_scripts_owner_user_id_idx on customer_service_scripts (owner_user_id);
create index customer_service_scripts_scenario_idx on customer_service_scripts (product_id, scenario);

create index lifecycle_tasks_product_id_idx on lifecycle_tasks (product_id);
create index lifecycle_tasks_owner_status_idx on lifecycle_tasks (owner_user_id, task_status);
create index lifecycle_tasks_due_date_idx on lifecycle_tasks (due_date);

create index audit_logs_owner_user_id_idx on audit_logs (owner_user_id);
create index audit_logs_actor_user_id_idx on audit_logs (actor_user_id);
create index audit_logs_product_id_idx on audit_logs (product_id);
create index audit_logs_entity_idx on audit_logs (entity_table, entity_id);
create index audit_logs_created_at_idx on audit_logs (created_at desc);

create index ai_generation_logs_product_id_idx on ai_generation_logs (product_id);
create index ai_generation_logs_owner_user_id_idx on ai_generation_logs (owner_user_id);
create index ai_generation_logs_status_idx on ai_generation_logs (owner_user_id, status);
create index ai_generation_logs_target_idx on ai_generation_logs (target_table, target_id);
create index ai_generation_logs_created_at_idx on ai_generation_logs (created_at desc);

create or replace function public.owns_product(check_product_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    where p.id = check_product_id
      and p.owner_user_id = (select auth.uid())
  );
$$;

alter table users enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table market_research_reports enable row level security;
alter table competitor_products enable row level security;
alter table launch_reports enable row level security;
alter table packaging_briefs enable row level security;
alter table listing_copies enable row level security;
alter table pricing_strategies enable row level security;
alter table marketing_assets enable row level security;
alter table social_posts enable row level security;
alter table video_scripts enable row level security;
alter table customer_faqs enable row level security;
alter table customer_service_scripts enable row level security;
alter table lifecycle_tasks enable row level security;
alter table audit_logs enable row level security;
alter table ai_generation_logs enable row level security;

create policy users_own_rows on users
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy products_own_rows on products
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy product_images_own_rows on product_images
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy market_research_reports_own_rows on market_research_reports
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy competitor_products_own_rows on competitor_products
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy launch_reports_own_rows on launch_reports
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy packaging_briefs_own_rows on packaging_briefs
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy listing_copies_own_rows on listing_copies
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy pricing_strategies_own_rows on pricing_strategies
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy marketing_assets_own_rows on marketing_assets
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy social_posts_own_rows on social_posts
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy video_scripts_own_rows on video_scripts
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy customer_faqs_own_rows on customer_faqs
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy customer_service_scripts_own_rows on customer_service_scripts
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy lifecycle_tasks_own_rows on lifecycle_tasks
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy audit_logs_own_select on audit_logs
  for select to authenticated
  using (owner_user_id = (select auth.uid()));

create policy ai_generation_logs_own_select on ai_generation_logs
  for select to authenticated
  using (owner_user_id = (select auth.uid()));
```

備註：

- `audit_logs` 與 `ai_generation_logs` 建議只允許 server/service role 寫入；上方只開使用者 select policy。
- 若要讓 authenticated user 直接 insert 部分 log，必須另外設計非常嚴格的 `with check`，避免偽造紀錄。
- 子表 policy 除了檢查 `owner_user_id = (select auth.uid())`，正式實作時也應在 insert/update 加上 parent ownership check，例如 `(select public.owns_product(product_id))`，避免使用者猜測序號型 `product_id` 後建立跨商品關聯。
- Supabase Storage policy 需另外設計，本文件只處理資料表。

## Prisma Schema 草案

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ProductLifecycleStatus {
  idea
  research
  positioning
  packaging
  listing
  marketing
  launched
  optimizing
  archived
}

enum ReviewStatus {
  pending_review
  edited
  approved
  rejected
}

enum RiskLevel {
  low
  medium
  high
}

enum GenerationStatus {
  queued
  running
  succeeded
  failed
}

enum AssetType {
  ig_post
  threads_post
  tiktok_caption
  ad_copy
  banner_copy
  email_copy
  canva_brief
}

enum TaskStatus {
  todo
  in_progress
  blocked
  done
  skipped
}

enum AuditAction {
  create
  update
  delete
  generate
  approve
  reject
  export
}

model User {
  id                String   @id @db.Uuid
  email             String   @unique
  displayName       String?  @map("display_name")
  avatarUrl         String?  @map("avatar_url")
  defaultBrandStyle String?  @map("default_brand_style")
  settings          Json     @default("{}")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @default(now()) @map("updated_at") @db.Timestamptz

  products          Product[]
  auditLogsOwned    AuditLog[] @relation("AuditOwner")
  auditLogsActed    AuditLog[] @relation("AuditActor")

  @@map("users")
}

model Product {
  id              BigInt   @id @default(autoincrement())
  ownerUserId     String   @map("owner_user_id") @db.Uuid
  name            String
  category        String
  lifecycleStatus ProductLifecycleStatus @default(idea) @map("lifecycle_status")
  stageNotes      String?  @map("stage_notes")
  features        String?
  cost            Decimal? @db.Decimal(12, 2)
  expectedPrice   Decimal? @map("expected_price") @db.Decimal(12, 2)
  currency        String   @default("TWD")
  targetAudience  String?  @map("target_audience")
  brandStyle      String?  @map("brand_style")
  salesPlatforms  String[] @default([]) @map("sales_platforms")
  specs           Json     @default("{}")
  usageNotes      String?  @map("usage_notes")
  warnings        String?
  metadata        Json     @default("{}")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @default(now()) @map("updated_at") @db.Timestamptz
  archivedAt      DateTime? @map("archived_at") @db.Timestamptz

  owner           User     @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)
  images          ProductImage[]
  marketResearchReports MarketResearchReport[]
  competitorProducts CompetitorProduct[]
  launchReports   LaunchReport[]
  packagingBriefs PackagingBrief[]
  listingCopies   ListingCopy[]
  pricingStrategies PricingStrategy[]
  marketingAssets MarketingAsset[]
  socialPosts     SocialPost[]
  videoScripts    VideoScript[]
  customerFaqs    CustomerFaq[]
  customerServiceScripts CustomerServiceScript[]
  lifecycleTasks  LifecycleTask[]
  auditLogs       AuditLog[]
  aiGenerationLogs AiGenerationLog[]

  @@index([ownerUserId])
  @@index([ownerUserId, lifecycleStatus])
  @@map("products")
}

model ProductImage {
  id              BigInt   @id @default(autoincrement())
  productId       BigInt   @map("product_id")
  ownerUserId     String   @map("owner_user_id") @db.Uuid
  storageProvider String   @default("mock") @map("storage_provider")
  bucketName      String?  @map("bucket_name")
  objectPath      String?  @map("object_path")
  publicUrl       String?  @map("public_url")
  fileName        String?  @map("file_name")
  mimeType        String?  @map("mime_type")
  fileSizeBytes   BigInt?  @map("file_size_bytes")
  width           Int?
  height          Int?
  sortOrder       Int      @default(0) @map("sort_order")
  altText         String?  @map("alt_text")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([ownerUserId])
  @@index([productId, sortOrder])
  @@map("product_images")
}

model MarketResearchReport {
  id                     BigInt @id @default(autoincrement())
  productId              BigInt @map("product_id")
  ownerUserId            String @map("owner_user_id") @db.Uuid
  title                  String
  marketSummary          String? @map("market_summary")
  targetAudienceAnalysis String? @map("target_audience_analysis")
  competitorSummary      String? @map("competitor_summary")
  sourceNotes            String? @map("source_notes")
  sources                Json    @default("[]")
  riskLevel              RiskLevel @default(medium) @map("risk_level")
  reviewStatus           ReviewStatus @default(pending_review) @map("review_status")
  createdAt              DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt              DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product                Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([ownerUserId])
  @@index([ownerUserId, reviewStatus])
  @@map("market_research_reports")
}

model CompetitorProduct {
  id               BigInt @id @default(autoincrement())
  productId        BigInt @map("product_id")
  ownerUserId      String @map("owner_user_id") @db.Uuid
  name             String
  brandName        String? @map("brand_name")
  url              String?
  platform         String?
  price            Decimal? @db.Decimal(12, 2)
  currency         String @default("TWD")
  positioningNotes String? @map("positioning_notes")
  strengths        String?
  weaknesses       String?
  evidence         Json @default("{}")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product          Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([ownerUserId])
  @@index([productId, platform])
  @@map("competitor_products")
}

model LaunchReport {
  id                 BigInt @id @default(autoincrement())
  productId          BigInt @map("product_id")
  ownerUserId        String @map("owner_user_id") @db.Uuid
  version            Int @default(1)
  title              String
  executiveSummary   String? @map("executive_summary")
  positioning        String?
  coreSellingPoints  Json @default("[]") @map("core_selling_points")
  checklist          Json @default("[]")
  firstMonthPlan     Json @default("[]") @map("first_month_plan")
  optimizationAdvice String? @map("optimization_advice")
  reviewStatus       ReviewStatus @default(pending_review) @map("review_status")
  riskLevel          RiskLevel @default(medium) @map("risk_level")
  approvedAt         DateTime? @map("approved_at") @db.Timestamptz
  exportedAt         DateTime? @map("exported_at") @db.Timestamptz
  createdAt          DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product            Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  packagingBriefs    PackagingBrief[]
  listingCopies      ListingCopy[]
  pricingStrategies  PricingStrategy[]
  marketingAssets    MarketingAsset[]
  customerFaqs       CustomerFaq[]

  @@unique([productId, version])
  @@index([productId])
  @@index([ownerUserId])
  @@index([ownerUserId, reviewStatus])
  @@map("launch_reports")
}

model PackagingBrief {
  id               BigInt @id @default(autoincrement())
  productId        BigInt @map("product_id")
  ownerUserId      String @map("owner_user_id") @db.Uuid
  launchReportId   BigInt? @map("launch_report_id")
  designDirection  String? @map("design_direction")
  visualKeywords   String[] @default([]) @map("visual_keywords")
  frontCopy        String? @map("front_copy")
  backCopy         String? @map("back_copy")
  requiredElements Json @default("[]") @map("required_elements")
  avoidElements    Json @default("[]") @map("avoid_elements")
  productionNotes  String? @map("production_notes")
  riskLevel        RiskLevel @default(medium) @map("risk_level")
  reviewStatus     ReviewStatus @default(pending_review) @map("review_status")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product          Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  launchReport     LaunchReport? @relation(fields: [launchReportId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([launchReportId])
  @@index([ownerUserId])
  @@map("packaging_briefs")
}

model ListingCopy {
  id               BigInt @id @default(autoincrement())
  productId        BigInt @map("product_id")
  ownerUserId      String @map("owner_user_id") @db.Uuid
  launchReportId   BigInt? @map("launch_report_id")
  platform         String
  title            String
  shortDescription String? @map("short_description")
  longDescription  String? @map("long_description")
  specTable        Json @default("{}") @map("spec_table")
  seoKeywords      String[] @default([]) @map("seo_keywords")
  riskLevel        RiskLevel @default(medium) @map("risk_level")
  reviewStatus     ReviewStatus @default(pending_review) @map("review_status")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product          Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  launchReport     LaunchReport? @relation(fields: [launchReportId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([launchReportId])
  @@index([ownerUserId, platform])
  @@map("listing_copies")
}

model PricingStrategy {
  id                BigInt @id @default(autoincrement())
  productId         BigInt @map("product_id")
  ownerUserId       String @map("owner_user_id") @db.Uuid
  launchReportId    BigInt? @map("launch_report_id")
  cost              Decimal? @db.Decimal(12, 2)
  suggestedPrice    Decimal? @map("suggested_price") @db.Decimal(12, 2)
  floorPrice        Decimal? @map("floor_price") @db.Decimal(12, 2)
  premiumPrice      Decimal? @map("premium_price") @db.Decimal(12, 2)
  currency          String @default("TWD")
  grossMarginRate   Decimal? @map("gross_margin_rate") @db.Decimal(5, 2)
  pricingRationale  String? @map("pricing_rationale")
  assumptions       Json @default("{}")
  riskLevel         RiskLevel @default(medium) @map("risk_level")
  reviewStatus      ReviewStatus @default(pending_review) @map("review_status")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product           Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  launchReport      LaunchReport? @relation(fields: [launchReportId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([launchReportId])
  @@index([ownerUserId])
  @@map("pricing_strategies")
}

model MarketingAsset {
  id             BigInt @id @default(autoincrement())
  productId      BigInt @map("product_id")
  ownerUserId    String @map("owner_user_id") @db.Uuid
  launchReportId BigInt? @map("launch_report_id")
  assetType      AssetType @map("asset_type")
  title          String
  content        String?
  platform       String?
  formatNotes    String? @map("format_notes")
  metadata       Json @default("{}")
  riskLevel      RiskLevel @default(low) @map("risk_level")
  reviewStatus   ReviewStatus @default(pending_review) @map("review_status")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product        Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  launchReport   LaunchReport? @relation(fields: [launchReportId], references: [id], onDelete: SetNull)
  socialPosts    SocialPost[]
  videoScripts   VideoScript[]

  @@index([productId])
  @@index([launchReportId])
  @@index([ownerUserId, assetType])
  @@map("marketing_assets")
}

model SocialPost {
  id               BigInt @id @default(autoincrement())
  productId        BigInt @map("product_id")
  ownerUserId      String @map("owner_user_id") @db.Uuid
  marketingAssetId BigInt? @map("marketing_asset_id")
  platform         String
  caption          String
  hashtags         String[] @default([])
  callToAction     String? @map("call_to_action")
  scheduledFor     DateTime? @map("scheduled_for") @db.Timestamptz
  reviewStatus     ReviewStatus @default(pending_review) @map("review_status")
  riskLevel        RiskLevel @default(low) @map("risk_level")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product          Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  marketingAsset   MarketingAsset? @relation(fields: [marketingAssetId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([marketingAssetId])
  @@index([ownerUserId, platform])
  @@index([scheduledFor])
  @@map("social_posts")
}

model VideoScript {
  id               BigInt @id @default(autoincrement())
  productId        BigInt @map("product_id")
  ownerUserId      String @map("owner_user_id") @db.Uuid
  marketingAssetId BigInt? @map("marketing_asset_id")
  platform         String?
  hook             String?
  scriptBody       String @map("script_body")
  shotList         Json @default("[]") @map("shot_list")
  durationSeconds  Int? @map("duration_seconds")
  cta              String?
  reviewStatus     ReviewStatus @default(pending_review) @map("review_status")
  riskLevel        RiskLevel @default(medium) @map("risk_level")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product          Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  marketingAsset   MarketingAsset? @relation(fields: [marketingAssetId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([marketingAssetId])
  @@index([ownerUserId])
  @@map("video_scripts")
}

model CustomerFaq {
  id             BigInt @id @default(autoincrement())
  productId      BigInt @map("product_id")
  ownerUserId    String @map("owner_user_id") @db.Uuid
  launchReportId BigInt? @map("launch_report_id")
  question       String
  answer         String
  category       String?
  sortOrder      Int @default(0) @map("sort_order")
  reviewStatus   ReviewStatus @default(pending_review) @map("review_status")
  riskLevel      RiskLevel @default(medium) @map("risk_level")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product        Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  launchReport   LaunchReport? @relation(fields: [launchReportId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([launchReportId])
  @@index([productId, sortOrder])
  @@map("customer_faqs")
}

model CustomerServiceScript {
  id               BigInt @id @default(autoincrement())
  productId        BigInt @map("product_id")
  ownerUserId      String @map("owner_user_id") @db.Uuid
  scenario         String
  responseTemplate String @map("response_template")
  tone             String?
  channel          String?
  reviewStatus     ReviewStatus @default(pending_review) @map("review_status")
  riskLevel        RiskLevel @default(medium) @map("risk_level")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product          Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([ownerUserId])
  @@index([productId, scenario])
  @@map("customer_service_scripts")
}

model LifecycleTask {
  id              BigInt @id @default(autoincrement())
  productId       BigInt @map("product_id")
  ownerUserId     String @map("owner_user_id") @db.Uuid
  title           String
  description     String?
  lifecycleStatus ProductLifecycleStatus @map("lifecycle_status")
  taskStatus      TaskStatus @default(todo) @map("task_status")
  dueDate         DateTime? @map("due_date") @db.Date
  completedAt     DateTime? @map("completed_at") @db.Timestamptz
  metadata        Json @default("{}")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @default(now()) @map("updated_at") @db.Timestamptz

  product         Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([ownerUserId, taskStatus])
  @@index([dueDate])
  @@map("lifecycle_tasks")
}

model AuditLog {
  id           BigInt @id @default(autoincrement())
  ownerUserId  String @map("owner_user_id") @db.Uuid
  actorUserId  String? @map("actor_user_id") @db.Uuid
  productId    BigInt? @map("product_id")
  entityTable  String @map("entity_table")
  entityId     BigInt? @map("entity_id")
  action       AuditAction
  beforeData   Json? @map("before_data")
  afterData    Json? @map("after_data")
  ipAddress    String? @map("ip_address") @db.Inet
  userAgent    String? @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  owner        User @relation("AuditOwner", fields: [ownerUserId], references: [id], onDelete: Cascade)
  actor        User? @relation("AuditActor", fields: [actorUserId], references: [id], onDelete: SetNull)
  product      Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([ownerUserId])
  @@index([actorUserId])
  @@index([productId])
  @@index([entityTable, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

model AiGenerationLog {
  id             BigInt @id @default(autoincrement())
  productId      BigInt @map("product_id")
  ownerUserId    String @map("owner_user_id") @db.Uuid
  targetTable    String? @map("target_table")
  targetId       BigInt? @map("target_id")
  workflowName   String @map("workflow_name")
  workflowVersion String @map("workflow_version")
  provider       String @default("mock")
  model          String?
  status         GenerationStatus @default(queued)
  inputSnapshot  Json @default("{}") @map("input_snapshot")
  outputSnapshot Json? @map("output_snapshot")
  promptVersion  String? @map("prompt_version")
  errorMessage   String? @map("error_message")
  tokensInput    Int? @map("tokens_input")
  tokensOutput   Int? @map("tokens_output")
  costUsd        Decimal? @map("cost_usd") @db.Decimal(12, 6)
  latencyMs      Int? @map("latency_ms")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz

  product        Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([ownerUserId])
  @@index([ownerUserId, status])
  @@index([targetTable, targetId])
  @@index([createdAt])
  @@map("ai_generation_logs")
}
```

Prisma 備註：

- Prisma enum 名稱使用 PascalCase，但 values 保持和 Postgres enum 一致。
- `users.id` 對應 Supabase Auth UUID，不用 Prisma 自動產生。
- Prisma 不會表達 Supabase RLS；RLS 必須用 SQL migration 管理。
- GIN index、RLS policy、extension、trigger 通常也需要 SQL migration 補充。

## ERD 文字描述

```text
users
  1 -> N products
  1 -> N audit_logs as owner
  1 -> N audit_logs as actor

products
  N -> 1 users
  1 -> N product_images
  1 -> N market_research_reports
  1 -> N competitor_products
  1 -> N launch_reports
  1 -> N packaging_briefs
  1 -> N listing_copies
  1 -> N pricing_strategies
  1 -> N marketing_assets
  1 -> N social_posts
  1 -> N video_scripts
  1 -> N customer_faqs
  1 -> N customer_service_scripts
  1 -> N lifecycle_tasks
  1 -> N audit_logs
  1 -> N ai_generation_logs

launch_reports
  N -> 1 products
  1 -> N packaging_briefs
  1 -> N listing_copies
  1 -> N pricing_strategies
  1 -> N marketing_assets
  1 -> N customer_faqs

marketing_assets
  N -> 1 products
  N -> 1 launch_reports optional
  1 -> N social_posts
  1 -> N video_scripts

audit_logs
  N -> 1 users as owner
  N -> 1 users as actor optional
  N -> 1 products optional

ai_generation_logs
  N -> 1 products
  target_table + target_id points to generated entity by convention
```

設計解讀：

- `products` 是商品生命週期核心，保存商品基本資料與當前狀態。
- `launch_reports` 是一次完整上市報告的版本容器。
- `packaging_briefs`、`listing_copies`、`pricing_strategies`、`marketing_assets`、`customer_faqs` 可掛在 `launch_reports` 下，保留版本關係。
- `social_posts` 與 `video_scripts` 可由 `marketing_assets` 衍生。
- `audit_logs` 用於不可忽略的重要操作，但不是事件總線。
- `ai_generation_logs` 保存生成過程與成本資訊，未來支援重新生成、debug 與模型比較。

## RLS 策略總結

MVP 的 RLS 採取單一 owner 模式：

- 所有業務資料表都有 `owner_user_id`。
- 使用者只能操作 `owner_user_id = (select auth.uid())` 的資料。
- `users` 表用 `id = (select auth.uid())`。
- `audit_logs` 與 `ai_generation_logs` 預設只讓使用者讀自己的資料，寫入由 server/service role 控制。

未來團隊版需要新增：

- `teams`
- `team_members`
- `product_team_access`
- security definer function，例如 `is_team_member(team_id)`
- 對 team membership 欄位建立 index，避免 RLS 查詢變慢

## 後續 migration 注意事項

- 實作 migration 時，新增 constraint 不要使用 `add constraint if not exists`；Postgres 不支援這種語法，需用 `do $$ begin if not exists (...) then ... end if; end $$;`。
- 若要在既有資料表加入 NOT NULL 欄位，應先加 nullable 欄位、回填資料，再加 NOT NULL constraint。
- 若使用 Prisma migration，仍需 SQL migration 補 RLS、policy、GIN index 與 Supabase Storage policy。
- 若本地用 SQLite，enum、jsonb、array、RLS 都會和 Supabase PostgreSQL 有差異；正式 schema 仍以 Postgres 為準。
