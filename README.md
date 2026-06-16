# PAQ Product Launch OS

> 上傳商品資料，AI 產出完整商品上市企劃書。

PAQ Product Launch OS 是一個商品上市 AI demo。使用者輸入商品名稱、類別、功能、成本、預計售價、目標客群、品牌風格、銷售平台與商品圖片後，系統會產出商品定位、競品分析、定價、包裝 brief、商品頁文案、社群素材、短影音腳本、FAQ、客服話術與首月行銷計畫。

目前 v0.2 是 Demo Polish 版本：使用 Mock AI response、localStorage 與前端審核狀態，不會呼叫正式 AI API，也不會寫入正式資料庫。

## 功能列表

- Landing page：清楚展示產品定位、核心賣點與 demo 商品入口。
- Demo 商品：文創小物、3C 配件、生活香氛三個範例可直接進入報告頁。
- 商品輸入頁：可建立商品企劃並產生 Mock AI 報告。
- Dashboard：顯示商品名稱、類別、生命週期狀態、建立時間與查看報告按鈕。
- Report page：每個 section 都可 Copy、Edit、Approve、Reject。
- Human review：修改後標記 human_edited，並建立 audit log mock。
- 匯出功能：Markdown、JSON、Shopify、蝦皮、Pinkoi、社群貼文包。
- Local persistence：Demo 商品與使用者建立的商品會保存在 localStorage。

## 技術棧

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local component system
- Mock AI workflow
- localStorage persistence
- Frontend-only human-in-the-loop review state

## 本地啟動

```bash
npm install
npm run dev
```

打開：

```text
http://localhost:3000
```

檢查：

```bash
npm run lint
npm run build
```

## Demo Flow

1. 到首頁 `/`。
2. 點「查看 Demo 商品」。
3. 選擇三個 demo 商品之一：
   - 文創小物：`/products/island-paper-bookmark/report`
   - 3C 配件：`/products/arc-snap-power-bank/report`
   - 生活香氛：`/products/after-rain-aroma-set/report`
4. 在報告頁測試 Copy、Edit、Approve、Reject。
5. 測試 Export Markdown / JSON。
6. 到 `/products/new` 建立自己的商品企劃。
7. 送出後會保存到 localStorage，並進入該商品報告頁。
8. 到 `/dashboard` 查看商品列表與生命週期進度。

## 環境變數

目前 demo 不需要環境變數。未來接真 AI 或 Supabase 時，請從 `.env.example` 複製：

```powershell
Copy-Item .env.example .env.local
```

重要原則：

- 不要把 API key、token、密碼寫進程式碼。
- `OPENAI_API_KEY` 只能在 server-side provider 或 API route 使用。
- `SUPABASE_SERVICE_ROLE_KEY` 只能在 server-side 使用。
- Client component 不得讀取任何 secret。

## Vercel 部署

1. 將專案推到 GitHub。
2. 在 Vercel 建立 New Project。
3. Import Git Repository。
4. Framework Preset 選 Next.js。
5. Install Command 使用 `npm install`。
6. Build Command 使用 `npm run build`。
7. 目前 demo 不需要設定環境變數。
8. Deploy 後檢查 `/`、`/dashboard`、`/products/new` 與 demo report routes。

## 未來接 Supabase 的方式

1. 依 `docs/database-schema.md` 建立 PostgreSQL schema。
2. 啟用 Row Level Security。
3. 將目前 localStorage 的 product/report state 對應到：
   - `products`
   - `launch_reports`
   - `ai_generation_logs`
   - `audit_logs`
4. 圖片可接 Supabase Storage 或 Cloudflare R2。
5. Report section review status 可由前端 state 改為資料庫欄位。

## 目前限制

- 目前是 Mock AI Demo，尚未呼叫 OpenAI API。
- 沒有正式登入、權限、資料庫與圖片儲存。
- 沒有串 Shopify、蝦皮、Pinkoi 或 TikTok Shop API。
- AI 內容不保證合法、正確或能帶來銷售。
- 食品、美妝、保健、醫療相關商品不得產生療效宣稱，正式使用前需人工與法規審核。
- 包裝圖像、字體、商標與素材授權需由真人確認。

## Roadmap

- v0.3：AI provider interface，可切換 MockAIProvider / OpenAIProvider。
- v0.4：OpenAI JSON output、validator、fallback 與 ai_generation_logs。
- v0.5：Supabase products、reports、audit logs、RLS。
- v0.6：圖片儲存、登入與專案權限。
- v0.7：平台模板深化與半自動上架前檢查。

## 文件

- `docs/product-spec.md`
- `docs/mvp-scope.md`
- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/ai-integration-plan.md`
- `docs/demo-script.md`
