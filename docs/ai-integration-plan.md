# PAQ Product Launch OS AI 整合計畫

## 目前階段

第 6 階段只建立 AI provider adapter、prompt、validator 與整合規格，不呼叫外部 API。現有產品頁與報告頁仍使用 mock workflow。

已建立的介面：

- `lib/ai/provider.ts`：統一 AI provider 介面，包含 `MockAIProvider` 與 `OpenAIProvider` placeholder。
- `lib/ai/prompts/product-launch-system-prompt.ts`：商品上市報告 system prompt。
- `lib/ai/prompts/product-launch-user-prompt.ts`：user prompt builder 與 JSON output schema instruction。
- `lib/ai/validators/launch-report-validator.ts`：AI 回傳資料結構驗證。

## 如何接 OpenAI API

正式串接時建議只在 server-side 執行：

1. 新增 Next.js API Route，例如 `app/api/ai/launch-report/route.ts`。
2. API Route 接收 `LaunchReportInput`，做基本欄位與權限檢查。
3. 建立 `OpenAIProvider`，由 server-side 環境變數讀取 `OPENAI_API_KEY`。
4. 使用 `PRODUCT_LAUNCH_SYSTEM_PROMPT` 與 `buildProductLaunchUserPrompt(input)` 組成 request。
5. 要求模型只回傳 JSON object，不接受 Markdown code fence。
6. 使用 `parseLaunchReportJson()` 或 `validateLaunchReportPayload()` 驗證回傳。
7. 驗證通過後才寫入資料庫與回傳前端。
8. 驗證失敗時記錄錯誤並回傳可重試狀態，不要把未驗證內容渲染到商品頁。

實作時再依當時官方文件選擇模型、SDK 版本與 JSON 輸出參數，不在 placeholder 中寫死。

## API key 保護

- `OPENAI_API_KEY` 只能存在 server-side environment variable。
- 不得放進 `.env.example` 以外的 repo 檔案；`.env.example` 只能放變數名稱，不放真值。
- 不得從 client component、瀏覽器 bundle、localStorage、sessionStorage 或 query string 讀取 API key。
- Vercel 部署時使用 Project Environment Variables。
- 本機開發使用 `.env.local`，並確認 `.gitignore` 排除。
- log 中不得輸出 API key、Authorization header、完整 prompt 中的敏感商業資料或使用者私密資訊。

## ai_generation_logs 記錄方式

未來接資料庫時，建議每次生成都寫入 `ai_generation_logs`：

- `id`
- `user_id`
- `product_id`
- `provider`
- `model`
- `prompt_version`
- `input_snapshot`
- `output_snapshot`
- `status`：`started`、`succeeded`、`failed`、`validation_failed`、`needs_review`
- `error_message`
- `token_usage`
- `latency_ms`
- `created_at`

注意事項：

- `input_snapshot` 與 `output_snapshot` 應移除 API key、個資、付款資料與不必要的敏感資訊。
- 若內容涉及法規敏感品類，應加上 `needs_review` 或類似旗標。
- prompt 版本需固定，例如 `product-launch-v1`，避免日後難以追溯產出差異。

## Human-in-the-loop 審核

AI 產出不能直接視為可上架內容。建議流程：

1. AI 生成報告後狀態設為 `pending_review`。
2. 使用者或內部審核者逐段檢查定位、競品、價格、包裝、商品頁、社群與客服內容。
3. 高風險章節，例如競品分析、定價、包裝文案、法規宣稱，預設標示為高優先審核。
4. 審核者可將章節標示為 `edited` 或 `approved`。
5. 只有 `approved` 內容才能進入匯出、上架或外部整合。
6. 所有人工修改需寫入 `audit_logs`，保留修改者、時間與修改前後摘要。

## AI hallucination 處理

風險：

- 捏造競品名稱、價格、銷售數字或市場排名。
- 把企劃推論寫成已驗證事實。
- 產生不符合平台規則或法規的廣告宣稱。
- 將通用建議包裝成確定可帶來銷售結果。

處理方式：

- Prompt 明確禁止宣稱即時搜尋、真實平台資料或已完成法規審核。
- Validator 只檢查結構，不代表內容為真；通過 validator 後仍需人工審核。
- 競品分析欄位應標示為策略參考，不使用未提供的真實營收、市占或評價數字。
- UI 顯示 `Demo / AI Draft` 或 `Needs Review` 標籤。
- 上架前加入人工 checklist，確認商標、版權、法規、平台規則與商品事實。

## 商標、版權與平台規則風險

AI 不得建議：

- 使用未授權品牌名稱、Logo、商標字樣或角色。
- 模仿競品包裝、視覺識別、廣告素材或商品圖。
- 使用名人肖像、KOL 形象或社群截圖作為包裝與廣告素材，除非已有授權。
- 宣稱平台推薦、官方認證、銷售排行或評價數據，除非有可驗證資料。

審核時需確認：

- 圖片、字體、icon、插畫與音樂授權。
- 商品頁是否符合 Shopify、蝦皮、Pinkoi、TikTok Shop 等平台規範。
- SEO keyword 是否含競品商標或不當導流字詞。

## 醫療、美妝、保健食品與食品風險

敏感類別包含但不限於：

- 食品、飲品、營養品、保健食品。
- 美妝、保養、精油、香氛。
- 醫療器材、健康監測用品、藥品相關商品。
- 兒童用品、寵物用品、清潔用品。

AI 產出必須避免：

- 治療、預防、改善疾病等醫療宣稱。
- 保證瘦身、抗老、消炎、改善睡眠、改善焦慮或提升免疫等未證實效果。
- 使用「無副作用」「醫師推薦」「臨床證明」等未提供證據的語句。
- 把使用者心得寫成普遍效果。

建議做法：

- 將功效語句改成材料、使用情境、香調、質地、包裝與體驗描述。
- 對敏感商品自動加入法規審核提醒。
- 正式上架前由熟悉當地法規與平台規則的人員審核。

## 下一步

第 7 階段前建議先補：

1. Server-side API Route 設計草案。
2. `.env.example`，只列出 `OPENAI_API_KEY=` 與 `OPENAI_MODEL=`。
3. `ai_generation_logs` 寫入流程。
4. 報告章節審核 UI 狀態。
5. OpenAI provider 的 integration test，使用 mock response，不打外部 API。
