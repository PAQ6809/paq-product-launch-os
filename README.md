# PAQ Product Launch OS

PAQ Product Launch OS 是一個商品上市 AI Demo：

> 上傳商品資料，AI 產出完整商品上市企劃書。

使用者輸入商品名稱、類別、功能、成本、預計售價、目標客群、品牌風格、銷售平台與商品圖片後，系統會整理商品定位、客群分析、競品差異、定價、包裝設計 brief、商品頁文案、SEO 關鍵字、社群貼文、短影音腳本、FAQ、客服話術、首月行銷計畫與銷售後優化建議。

目前版本是可展示的 AI Demo。預設使用 MockAIProvider；若設定 `AI_PROVIDER=openai` 與 `OPENAI_API_KEY`，會透過 server-side API route 呼叫 OpenAIProvider。資料仍保存在 localStorage，方便 demo 與本機測試。

## 功能列表

- Landing page：清楚展示產品定位、核心賣點、可獲得內容與 demo 商品入口。
- 商品輸入頁：填入商品資料後產生 mock 商品上市企劃報告。
- Dashboard：查看商品列表、類別、生命週期狀態、建立時間與報告入口。
- Demo 報告頁：以正式企劃書方式呈現上市摘要、商品定位、競品分析、包裝與文案、社群素材、行銷計畫與風險提醒。
- Human review：每個 section 支援 Copy、Edit、Approve、Reject；編輯後會標記 human_edited。
- 匯出功能：Export Markdown、Export JSON、Copy Full Report、Shopify、蝦皮、Pinkoi 與社群貼文包模板。
- Local persistence：demo 商品與使用者建立的商品會保存在 localStorage。
- AI provider：可切換 MockAIProvider / OpenAIProvider，沒有 API key 或 OpenAI 回傳格式錯誤時自動 fallback。

## 技術棧

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local component system
- Mock AI workflow
- Server-side AI API route
- localStorage persistence
- Frontend-only human-in-the-loop review state

## 本地啟動

```bash
npm install
npm run dev
```

開啟：

```text
http://localhost:3000
```

檢查：

```bash
npm run lint
npm run build
```

## Demo Flow

1. 打開首頁 `/`。
2. 點擊「開始建立商品企劃」建立自己的商品，或點擊「查看 Demo 商品」快速看成果。
3. 直接查看三個 demo 商品：
   - 文創小物：`/products/island-paper-bookmark/report`
   - 3C 配件：`/products/arc-snap-power-bank/report`
   - 生活香氛：`/products/after-rain-aroma-set/report`
4. 在報告頁先看「上市企劃摘要」與商品生命週期進度。
5. 往下展示商品定位、客群、競品、定價、包裝、商品頁、社群與首月行銷計畫。
6. 示範 Copy section、Edit、Approve、Reject。
7. 使用 Export Markdown、Export JSON 或 Copy Full Report 匯出整份企劃。

## Demo 商品說明

- 文創小物：適合展示包裝設計 brief、禮品情境、Pinkoi 與 IG 銷售溝通。
- 3C 配件：適合展示規格比較、價格理由、蝦皮 / Shopify 商品頁與短影音腳本。
- 生活香氛：適合展示生活風格定位、感性文案、風險提醒與不能宣稱療效的審核重點。

## 如何展示給潛在客戶

對店家可以這樣介紹：

> 這個 demo 不是幫你直接投廣告，而是先把商品上市前最常卡住的內容整理成一份企劃書：定位、客群、競品差異、包裝文案、商品頁、社群貼文、短影音腳本、FAQ 和首月行銷計畫。你可以先用這份報告跟設計、行銷、客服或通路窗口討論，再人工審核後上架。

對創業比賽或老師可以這樣介紹：

> PAQ Product Launch OS 把小品牌上市商品時分散的決策流程整理成一個 AI-assisted workflow。MVP 先以 demo flow 驗證價值：商品資料輸入後，系統透過 MockAIProvider 或 OpenAIProvider 產出可複製、可匯出、可人工審核的上市企劃報告；未來再接 Supabase 與平台整合。

## 目前限制

- 預設仍為 Mock Demo；只有設定 `AI_PROVIDER=openai` 與 `OPENAI_API_KEY` 才會呼叫 OpenAI API。
- 目前不串 Shopify、蝦皮、Pinkoi、TikTok Shop 或任何平台 API。
- 目前不保證 AI 圖片、包裝設計或文案可直接商用。
- 食品、美妝、保健與醫療商品不得宣稱療效，正式使用前必須人工審核。
- localStorage 只適合 demo；正式多人使用需改成 Supabase PostgreSQL 與 Storage。

## Vercel 部署

1. 將專案推到 GitHub。
2. 到 Vercel 建立 New Project。
3. Import GitHub repo：`paq-product-launch-os`。
4. Framework Preset 選 Next.js。
5. Install Command 使用 `npm install`。
6. Build Command 使用 `npm run build`。
7. 目前 demo 不需要環境變數即可部署。
8. 部署後檢查 `/`、`/dashboard`、`/products/new` 與三個 demo report routes。

## 未來接 Supabase 的方式

1. 依照 `docs/database-schema.md` 建立 Supabase PostgreSQL schema。
2. 啟用 Row Level Security。
3. 將 localStorage 狀態逐步搬到：
   - `products`
   - `launch_reports`
   - `ai_generation_logs`
   - `audit_logs`
4. 商品圖片可改接 Supabase Storage 或 Cloudflare R2。
5. Report section 的 review status 與 human_edited 狀態可寫入資料庫，作為正式審核紀錄。

## Roadmap

- v0.3：已加入 AI provider interface，可切換 MockAIProvider / OpenAIProvider。
- v0.4：ai_generation_logs、provider telemetry 與更完整的錯誤追蹤。
- v0.5：Supabase products、reports、audit logs、RLS。
- v0.6：圖片上傳、素材管理與包裝 brief 工作流。
- v0.7：平台模板強化、團隊審核與展示案例管理。

## 相關文件

- `docs/product-spec.md`
- `docs/mvp-scope.md`
- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/demo-script.md`
