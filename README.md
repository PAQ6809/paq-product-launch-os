# PAQ Product Launch OS

## Current Version Status

- v0.4.8 Real AI Product Analysis Engine is completed and merged to `main`.
- NVIDIA logged-in real AI smoke has passed locally with report persistence to Supabase `launch_reports`.
- v0.4.9 Production Readiness / Vercel Deployment Hardening adds deploy policy, Vercel env guidance, Supabase Auth production setup, security headers, and a production smoke checklist.

Production readiness docs:

- `docs/production-env-policy.md`
- `docs/vercel-deployment.md`
- `docs/supabase-auth-production.md`
- `docs/security-headers.md`
- `docs/production-smoke-checklist.md`

Production defaults:

```env
AI_PROVIDER=nvidia
ENABLE_PUBLIC_REAL_AI=false
REAL_AI_REQUIRE_LOGIN=true
HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_HELP_AI=false
ENABLE_DEV_DIAGNOSTICS=false
ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION=false
```

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be public. Provider keys, Supabase service role keys, and encryption keys must stay server-side only.

PAQ Product Launch OS 是一個商品上市 AI Demo：

> 上傳商品資料，AI 產出完整商品上市企劃書。

使用者輸入商品名稱、類別、功能、成本、預計售價、目標客群、品牌風格、銷售平台與商品圖片後，系統會整理商品定位、客群分析、競品差異、定價、包裝設計 brief、商品頁文案、SEO 關鍵字、社群貼文、短影音腳本、FAQ、客服話術、首月行銷計畫與銷售後優化建議。

目前版本是可展示的 SaaS MVP。預設使用 MockAIProvider；若登入且設定 `AI_PROVIDER=openai|nvidia` 與對應 server-side API key，會透過 `POST /api/generate-report` 產生真實商品分析。公開 production demo 預設強制 mock，避免 API key 被刷爆。

## 功能列表

- Landing page：清楚展示產品定位、核心賣點、可獲得內容與 demo 商品入口。
- 商品輸入頁：填入商品資料後產生 mock 商品上市企劃報告。
- Dashboard：查看商品列表、類別、生命週期狀態、建立時間與報告入口。
- Demo 報告頁：以正式企劃書方式呈現上市摘要、商品定位、競品分析、包裝與文案、社群素材、行銷計畫與風險提醒。
- Human review：每個 section 支援 Copy、Edit、Approve、Reject；編輯後會標記 human_edited。
- 匯出功能：Export Markdown、Export JSON、Copy Full Report、Shopify、蝦皮、Pinkoi 與社群貼文包模板。
- Local persistence：demo 商品與使用者建立的商品會保存在 localStorage。
- AI provider：可切換 MockAIProvider / OpenAIProvider / NvidiaProvider，沒有登入、缺 API key、production safety 關閉或 JSON 驗證失敗時自動 fallback。
- API safety：商品報告 API 具備 IP-based rate limit，公開 production demo 預設強制使用 MockAIProvider。
- Developer role：`profiles.role` 控制 developer/admin 診斷頁存取，前端只顯示 server-side role 結果，不暴露 API key 或 secret。

## 技術棧

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local component system
- Mock AI workflow
- Server-side AI API route
- localStorage persistence
- Frontend-only human-in-the-loop review state
- 共用 frontend design system 與 responsive layout primitives
- Playwright visual smoke test

## Design System / Responsive Hardening

v0.3.5 統一使用 `AppShell`、`ContentContainer`、`PageHeader`、`SectionHeader`、`ProductCard`、`ReportSectionCard`、`StatusBadge`、`EmptyState` 與 `CopyButton`。圖片使用固定比例容器，長文案與英文可換行，手機控制列不依賴固定高度。

設計規則見 `docs/design-system.md`，人工 viewport 檢查見 `docs/responsive-qa-checklist.md`，發佈前檢查見 `docs/frontend-quality-checklist.md`。

### Visual test

第一次執行先安裝 Chromium：

```bash
npx playwright install chromium
npm run test:visual
```

測試會在 390x844、768x1024、1440x900 開啟首頁與 Demo 報告，檢查主要內容、控制按鈕與水平 overflow，並把截圖保存至 `test-results/visual`。目前採 screenshot capture + layout assertions，不把 snapshot baseline 加入一般 build gate。

```bash
npm run test:visual:update
```

`test:visual:update` 預留給未來加入 snapshot comparison；目前與 capture 測試使用相同 routes。CI 暫不啟用，避免 visual environment 差異阻擋一般 build。

## Developer QA / Frontend QA

v0.4.6-pre is the UI safety baseline before extending the AI Help Center. It verifies that `AppShell`, `Header`, `LanguageSwitcher`, `UserMenu`, auth pages, core routes, and the existing floating help entry do not create layout shift, horizontal overflow, or covered primary actions.

Run the full preflight gate before merging Help Center UI work:

```bash
npm run i18n:check
npm run lint
npm run build
npm run test:visual
```

The visual suite covers 390x844, 768x1024, and 1440x900. It checks auth text integrity, header/body overflow, language switcher bounds, primary CTA usability, and floating widget overlap safety.

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

1. 打開首頁 `/zh-TW`，或切換 `/en`、`/ja`、`/ko`、`/ar`。
2. 點擊「開始建立商品企劃」建立自己的商品，或點擊「查看 Demo 商品」快速看成果。
3. 直接查看三個 demo 商品：
   - 文創小物：`/zh-TW/products/island-paper-bookmark/report`
   - 3C 配件：`/zh-TW/products/arc-snap-power-bank/report`
   - 生活香氛：`/zh-TW/products/after-rain-aroma-set/report`
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

> PAQ Product Launch OS 把小品牌上市商品時分散的決策流程整理成一個 AI-assisted workflow。MVP 先以 demo flow 驗證價值：商品資料輸入後，系統透過 MockAIProvider / OpenAIProvider / NvidiaProvider 產出可複製、可匯出、可人工審核的上市企劃報告；登入後可把商品、草稿與報告保存到 Supabase workspace。

## 目前限制

- 預設仍為 Mock Demo；登入後且設定 `AI_PROVIDER=openai|nvidia`、對應 API key、`ENABLE_PUBLIC_REAL_AI=true` 或非公開安全環境時，才會呼叫真實 provider。
- 目前不串 Shopify、蝦皮、Pinkoi、TikTok Shop 或任何平台 API。
- 目前不保證 AI 圖片、包裝設計或文案可直接商用。
- 食品、美妝、保健與醫療商品不得宣稱療效，正式使用前必須人工審核。
- localStorage 仍是匿名 demo fallback；登入後商品、草稿與報告可同步到 Supabase PostgreSQL。商品圖片仍是 mock / local preview，正式版再接 Supabase Storage 或 Cloudflare R2。
- Visual smoke test 目前只覆蓋三個代表 viewport，320、375、430、1024、1280 仍需人工 QA。
- 尚未導入 Storybook 或 Chromatic；元件數量與團隊規模增加後再評估。
- Phase one 完整啟用 `zh-TW`、`en`、`ja`、`ko`、`ar`；其餘七種 locale 已保留 catalog，尚未對外啟用。

## Localization / AI Translation

網站使用 `next-intl` App Router locale routes。Header 的語言選擇器會保留目前頁面，只切換介面語言；Arabic 會自動套用 RTL。報告頁可選擇目標語言、查看原文／翻譯／雙語對照，翻譯仍保留 Copy、人工編輯、審核與匯出流程。

報告翻譯只透過 `POST /api/translate-report` 在 server side 呼叫 provider。`TRANSLATION_PROVIDER=mock|openai|nvidia`，缺少 key、格式驗證失敗、逾時或公開 production 禁用真 AI 時都會回到 MockTranslationProvider。localStorage cache 以報告、目標語言與來源 hash 分流，來源變更會自動失效。完整設計見 `docs/localization.md`。

## Live Demo 部署

1. 將專案推到 GitHub。
2. 到 Vercel 建立 New Project。
3. Import GitHub repo：`paq-product-launch-os`。
4. Framework Preset 選 Next.js。
5. Install Command 使用 `npm install`。
6. Build Command 使用 `npm run build`。
7. 公開 demo 使用下方 Production safety 設定，不需要放 OpenAI 或 NVIDIA key。
8. 部署後檢查 `/`、`/dashboard`、`/products/new` 與三個 demo report routes。

完整步驟見 `docs/deployment.md`；部署完成後依 `docs/production-smoke-test.md` 驗證頁面、API、forced mock、rate limit、secret 與手機版。

### Production safety 設定

```env
AI_PROVIDER=mock
TRANSLATION_PROVIDER=mock
ENABLE_PUBLIC_REAL_AI=false
REAL_AI_REQUIRE_LOGIN=true
REAL_AI_RATE_LIMIT_ENABLED=true
REAL_AI_RATE_LIMIT_WINDOW_SECONDS=3600
REAL_AI_RATE_LIMIT_MAX_REQUESTS=5
ENABLE_DEV_DIAGNOSTICS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=3600
RATE_LIMIT_MAX_REQUESTS=5
```

目前公開 demo 預設使用 MockAIProvider。真實 OpenAI / NVIDIA 測試只應在受 access control 保護的 Preview deployment 執行，且測試完成後立即關閉 `ENABLE_PUBLIC_REAL_AI`。

## API Safety / Rate Limit / Quota

`POST /api/generate-report` 只在 server-side 呼叫 AI provider，API key 不會送到瀏覽器。預設安全設定如下：

```env
ENABLE_PUBLIC_REAL_AI=false
ENABLE_DEV_DIAGNOSTICS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=3600
RATE_LIMIT_MAX_REQUESTS=5
```

公開 production demo 在 `ENABLE_PUBLIC_REAL_AI` 不是 `true` 時，會忽略 OpenAI / NVIDIA provider 設定並強制 fallback 到 MockAIProvider。`REAL_AI_REQUIRE_LOGIN=true` 時，未登入使用者也會 fallback 到 mock 並回傳 warning。超過 rate limit 時 API 回傳 HTTP 429 與可重試時間，不會啟動任何 provider 呼叫。

目前 rate limit 使用單一 server process 的記憶體，只適合本機與簡易 demo。正式上線應換成 Upstash Redis、Vercel Redis / KV 或 Supabase，並在登入後以 user / workspace 作為 quota key。完整設定與封閉測試流程見 `docs/api-safety.md`，真實商品分析設計見 `docs/real-ai-product-analysis.md`。

## Supabase Workspace Persistence

v0.4.7 keeps the demo local-first while adding the first real SaaS workspace path:

```txt
登入 → 建立產品 → autosave → 生成報告 → 保存報告 → dashboard 歷史產品 → 重新登入恢復
```

1. 依照 `docs/supabase-schema.sql` 建立 Supabase PostgreSQL schema。
2. 確認 RLS 已啟用，且每張 workspace 表都用 `auth.uid()` 限制 owner rows。
3. 設定 `NEXT_PUBLIC_SUPABASE_URL` 與 publishable / anon key。
4. 登入後，`/api/products`、`/api/drafts`、`/api/reports` 會保存 workspace 資料。
5. 未登入或 Supabase 未設定時，前端會回到 localStorage demo flow，不阻斷展示。
6. 商品圖片可在下一階段改接 Supabase Storage 或 Cloudflare R2。
7. Report section 的 review status 與 human_edited 狀態可在後續寫入資料庫，作為正式審核紀錄。

## Roadmap

- v0.3：已加入 AI provider interface，可切換 MockAIProvider / OpenAIProvider。
- v0.4：AI provider safety、Auth、Developer Console、Help Center、Product Workspace persistence 與 Real AI Product Analysis Engine。
- v0.5：審核狀態 / audit log 持久化、Supabase Storage、付費與 quota。
- v0.6：圖片上傳、素材管理與包裝 brief 工作流。
- v0.7：平台模板強化、團隊審核與展示案例管理。

## 相關文件

- `docs/product-spec.md`
- `docs/mvp-scope.md`
- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/demo-script.md`
- `docs/api-safety.md`
- `docs/deployment.md`
- `docs/production-smoke-test.md`
- `docs/design-system.md`
- `docs/responsive-qa-checklist.md`
- `docs/frontend-quality-checklist.md`
- `docs/localization.md`
- `docs/developer-role.md`

## v0.4 Auth + Workspace + Autosave

v0.4 adds Supabase Auth and cloud workspace persistence while keeping the public demo local-first. Anonymous users can still create products, generate mock/AI reports, copy/export, and use localStorage. Signed-in users can additionally sync products, drafts, and reports through server-side API routes. v0.4.7 also restores the latest cloud draft on the product input page when Supabase is configured.

Key files:

- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- `app/[locale]/login`, `app/[locale]/signup`, `app/[locale]/reset-password`
- `app/api/products`, `app/api/drafts`, `app/api/reports`, `app/api/anonymous-draft/import`
- `lib/autosave/local-draft.ts`, `lib/autosave/draft-sync.ts`, `hooks/useAutosaveProductDraft.ts`
- `docs/auth-and-workspace.md`
- `docs/persistence-and-autosave.md`
- `docs/supabase-schema.sql`
- `docs/supabase-live-smoke-test.md`
- `docs/workspace-api-smoke-test.md`

Supabase env:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The frontend only uses the publishable/anon key. Workspace API routes validate the Supabase session server-side and never trust a client-supplied `user_id`. If the user is anonymous or Supabase is not configured, the app falls back to local/demo persistence.

Before merging workspace persistence changes to `main`, run the live checklist in `docs/supabase-live-smoke-test.md` and the API checklist in `docs/workspace-api-smoke-test.md`, including user A / user B isolation.

## v0.4.x Developer Role / Admin Safety

Developer diagnostics live at `/dev`, which is localized by middleware to `/{locale}/dev`. In production with Supabase configured, developer pages call server-side role helpers before rendering:

- `lib/auth/roles.ts`: `getCurrentUserProfile`, `getCurrentUserRole`, `isDeveloper`, `requireDeveloper`, `isAdmin`, `requireAdmin`.
- `app/[locale]/dev`: safe Developer Console.
- `app/[locale]/dev/ai-diagnostics`: AI provider safety status.
- `app/[locale]/dev/help-diagnostics`: Help Center provider safety status.

Formal developer access requires a signed-in Supabase user and `public.profiles.role` set to `developer` or `admin`. The UserMenu badge and Developer Console link are display-only; route protection is server-side. When Supabase is not configured, `/dev` shows Demo Developer Mode with mock diagnostics and no real account claim.

In production, developer routes are closed unless `ENABLE_DEV_DIAGNOSTICS=true` and the signed-in user has `developer` or `admin` role. Production does not fall back to Demo Developer Mode when Supabase is missing.

The console may show provider names, public AI booleans, rate-limit settings, i18n status, and whether OpenAI/NVIDIA keys are configured as `true` or `false`. It must not show raw API keys, service role keys, encryption keys, auth tokens, cookies, or raw environment dumps. Grant/revoke SQL templates are in `docs/developer-role.md`.

## v0.4.5 Security / Compliance / Professional Reports

v0.4.5 adds a security and professional-report foundation without changing the public demo contract.

New security controls:

- `lib/security/encryption.ts`: server-only AES-256-GCM helper for sensitive JSON/text payloads.
- `lib/security/audit.ts`: export/security event helpers with hashed IP/user-agent utilities.
- `lib/security/same-origin.ts`: same-origin guard for new cookie-authenticated state-changing routes.
- `docs/security-and-compliance.md`: data categories, sensitivity levels, controls, and non-claims.
- `docs/encryption-design.md`: payload shape, key handling, and rotation notes.

New persistence/schema concepts:

- `encrypted_confidential_data` on `products`
- `encrypted_form_data` on `product_drafts`
- `encrypted_report` on `launch_reports`
- `encrypted_translation` on `report_translations`
- `export_jobs`
- `report_collections`
- `user_security_events`
- `data_requests`

New professional report builder:

- `lib/report-builder/normalize-report-to-template.ts`
- `lib/report-builder/templates/product-analysis-template.ts`
- Product analysis exports: Markdown, JSON, HTML, CSV summary, and ZIP-package manifest.
- Collection exports: Markdown, JSON, HTML, CSV summary.

New routes:

- `/[locale]/reports/collections`
- `/[locale]/reports/collections/new`
- `/[locale]/reports/collections/[id]`
- `/[locale]/settings/security`
- `/[locale]/legal/privacy`
- `/[locale]/legal/terms`

New protected APIs:

- `POST /api/exports/product-analysis`
- `POST /api/exports/collection-report`
- `GET /api/exports/jobs`
- `GET /api/exports/jobs/[id]`
- `GET/POST /api/report-collections`
- `GET/DELETE /api/report-collections/[id]`
- `POST /api/account/export-data`
- `POST /api/account/delete-request`

Additional env:

```env
ENCRYPTION_MASTER_KEY=
ENCRYPTION_KEY_VERSION=v1
REQUIRE_ENCRYPTION_IN_PRODUCTION=true
EXPORT_RETENTION_HOURS=24
ENABLE_EXPORT_AUDIT_LOG=true
ENABLE_DATA_EXPORT=true
ENABLE_ACCOUNT_DELETE_REQUEST=true
```

Production note: set `ENCRYPTION_MASTER_KEY` before enabling encrypted cloud persistence. Development can use a warning-based fallback key, but production fails closed when `REQUIRE_ENCRYPTION_IN_PRODUCTION=true`.

## v0.4.6 AI Help Center

v0.4.6 adds a site-scoped AI Help Center for product workflow, report generation, export formats, translation, auth, workspace persistence, security, privacy, and compliance questions. It is intentionally not a general chatbot.

Key files:

- `app/api/help-chat/route.ts`
- `lib/help/help-knowledge-base.ts`
- `lib/help/mock-help-provider.ts`
- `lib/help/nvidia-help-provider.ts`
- `lib/help/help-scope-guard.ts`
- `components/help/HelpChatButton.tsx`
- `docs/ai-help-center.md`
- `docs/help-knowledge-base.md`
- `docs/help-audit-plan.md`

Help env:

```env
HELP_AI_PROVIDER=mock
ENABLE_PUBLIC_HELP_AI=false
HELP_RATE_LIMIT_ENABLED=true
HELP_RATE_LIMIT_WINDOW_SECONDS=3600
HELP_RATE_LIMIT_MAX_REQUESTS=20
HELP_MAX_MESSAGES_PER_THREAD=20
NVIDIA_API_KEY=
NVIDIA_MODEL=minimaxai/minimax-m2.7
```

Frontend components only call `POST /api/help-chat`; NVIDIA is server-side only. Without `NVIDIA_API_KEY`, or when `ENABLE_PUBLIC_HELP_AI=false`, the assistant uses `MockHelpProvider`. Help chat uses sessionStorage for short-term UI memory and audit logs only metadata, not full conversations. The public Help widget is hidden on developer diagnostics routes, and Help UI copy is managed through `messages/*.json`.
