# PAQ Product Launch OS GitHub Repo 研究

研究日期：2026-06-15

本文件研究 10 個 GitHub repo，目標是找出可參考的功能、架構、資料模型與 AI workflow，用於後續建立 PAQ Product Launch OS。研究方式以 GitHub repo metadata、README、package.json、pyproject.toml、requirements.txt、LICENSE 與主要目錄結構為主。

重要限制：

- 不直接複製任何外部 repo 程式碼。
- License 不明、限制性 license、GPL 或 AGPL repo 僅能作為概念參考，除非未來完整遵守其 license 義務。
- 本階段只做研究文件，不修改專案程式碼。

## 1. medusajs/medusa

1. repo 名稱：medusajs/medusa
2. GitHub URL：https://github.com/medusajs/medusa
3. 主要用途：開源 commerce platform，提供電商核心模組、訂單、商品、客戶、付款、履約、promotion、pricing 等商務基礎能力。
4. 技術棧：TypeScript、Node.js、React、Vite、PostgreSQL 相關測試工具、Turbo monorepo、Zod、Awilix、Jest/Vitest。
5. 專案架構重點：
   - 大型 TypeScript monorepo。
   - `packages/` 底下拆分 commerce modules、admin、SDK、framework。
   - 以模組化 commerce primitives 為核心，不把所有業務邏輯塞進單一 app。
   - 有 admin extension、custom fields、workflow、module service 等可擴充設計。
6. 可重用概念：
   - 商品、價格、促銷、庫存、客戶與訂單等 domain model 的分層方式。
   - 模組化 commerce backend 的邊界設計。
   - admin UI extension 與 custom field 思維。
   - 將「商品資料」與「上架/銷售流程」分離。
7. 可重用功能：
   - 商品資料模型與 variant/option 思維可參考。
   - pricing、promotion、sales channel 等概念可作為未來平台化擴充依據。
   - 不是 MVP 必接，但可作為後續商品管理核心的參考。
8. 不適合使用的地方：
   - 對 MVP 太大，直接採用會讓系統變成完整電商 backend。
   - PAQ Product Launch OS 第一版不是訂單、金流、庫存系統。
   - 若直接整合 Medusa，需要承擔大量 commerce infrastructure 複雜度。
9. license：MIT。
10. 是否適合整合進 PAQ Product Launch OS：短期不整合，長期可考慮作為 commerce backend 或資料模型參考。
11. 建議採用方式：copy concept。
12. 對本專案的啟發：
   - PAQ 的核心資料模型應先圍繞 `ProductProject`、`ProductInput`、`LaunchReport`、`ReportSection`，不要一開始做完整訂單/庫存。
   - 但商品、價格、sales channel、variant 等命名與邊界可以向 Medusa 借鏡，讓未來接 Shopify、Medusa 或自架商店時比較容易。

## 2. Shopify/Shopify-AI-Toolkit

1. repo 名稱：Shopify/Shopify-AI-Toolkit
2. GitHub URL：https://github.com/Shopify/Shopify-AI-Toolkit
3. 主要用途：提供 AI agent plugin/extension，讓 Claude Code、Codex、Cursor、Gemini CLI、VS Code 等工具連接 Shopify docs、API schema、code validation 與 store management。
4. 技術棧：JavaScript、Codex/Claude/Cursor/Gemini plugin 結構、MCP 設定、Shopify skills、schema/type assets。
5. 專案架構重點：
   - 以 plugin/skills 方式包裝工具能力。
   - 包含 `.codex-plugin`、`.claude-plugin`、`.cursor-plugin`、`.mcp.json`、`skills/`。
   - 將 docs search、schema validation、Liquid/Hydrogen/Polaris knowledge 拆成可被 agent 使用的工具。
6. 可重用概念：
   - 用「工具化知識庫」讓 AI 在特定平台內更準確。
   - 將平台規範、API schema、validation 拆成 agent 可呼叫能力。
   - 未來 PAQ 可以有自己的 `paq-platform-rules`、`paq-report-validator`、`paq-exporter` 類似工具。
7. 可重用功能：
   - Shopify 文件查詢與 schema validation 的產品方向可參考。
   - 若 PAQ 未來接 Shopify，這套工具可協助開發與驗證 Shopify app。
8. 不適合使用的地方：
   - 它是 AI 開發工具 plugin，不是 end-user 商品上市 SaaS。
   - 不提供 PAQ 需要的商品上市報告資料模型。
   - 第一版不直接串 Shopify，因此不應把它放進 MVP 核心。
9. license：MIT。
10. 是否適合整合進 PAQ Product Launch OS：不整合進產品核心；未來做 Shopify adapter 時可作開發輔助。
11. 建議採用方式：reference only。
12. 對本專案的啟發：
   - PAQ 後續可以把「平台規則」做成可維護的 ruleset，例如 Shopify、蝦皮、Amazon、Pinkoi 各自的標題限制、圖片規格、禁用宣稱與欄位格式。

## 3. Shopify/shop-chat-agent

1. repo 名稱：Shopify/shop-chat-agent
2. GitHub URL：https://github.com/Shopify/shop-chat-agent
3. 主要用途：Shopify storefront AI chat reference app，讓消費者用聊天方式搜尋商品、詢問政策、建立購物車、結帳、查訂單與退貨。
4. 技術棧：JavaScript/React、React Router、Vite、Prisma、Shopify App Bridge、Shopify app session storage、Anthropic SDK、MCP client、Shopify theme extension。
5. 專案架構重點：
   - `app/` 放 React Router app server 與 route。
   - `app/services/` 放 Claude、streaming、tool、config 等服務。
   - `app/mcp-client.js` 負責 Shopify MCP tools integration。
   - `prisma/schema.prisma` 管理 app/session 相關資料。
   - `extensions/` 用於 Shopify theme extension chat UI。
6. 可重用概念：
   - AI backend 不直接硬寫所有能力，而是透過 tools/MCP 呼叫商店能力。
   - 把「安全工具」與「會改變狀態的工具」分開，適合未來處理上架、改價、發布等高風險操作。
   - streaming response 與 chat endpoint 的互動型 UX 可參考。
7. 可重用功能：
   - 未來若 PAQ 加入「商品上市助理聊天介面」，可參考其 chat UI + tool calling 架構。
   - 可參考 MCP tool orchestration，不直接複製。
8. 不適合使用的地方：
   - license 限制用途只能用於開發與 Shopify software/services 整合或互通的 application，一般化商品上市 SaaS 不應直接使用其程式碼。
   - 它偏向 storefront shopper assistant，不是商家端商品企劃報告系統。
   - 第一版不需要 Shopify app/theme extension。
9. license：自訂 Shopify 授權，GitHub API 未標示 SPDX；內容類似 MIT 但限制只能用於 Shopify software/services integration/interoperation。
10. 是否適合整合進 PAQ Product Launch OS：只在未來 Shopify app 版本中有限度參考，不適合放入通用 MVP。
11. 建議採用方式：reference only。
12. 對本專案的啟發：
   - PAQ 的 AI workflow 需要明確區分「只產生建議」與「會對外發布或修改平台資料」的動作。
   - 未來接平台 API 時，上架、改價、投廣告、發布內容都應先 human approval。

## 4. Nutlope/description-generator

1. repo 名稱：Nutlope/description-generator
2. GitHub URL：https://github.com/Nutlope/description-generator
3. 主要用途：上傳商品圖片後，用 vision model 產生多語商品描述的 demo app。
4. 技術棧：TypeScript、Next.js App Router、React、Tailwind、Radix UI、lucide-react、Together AI、Llama 3.2 Vision、S3 image upload、Zod。
5. 專案架構重點：
   - `app/page.tsx` 作為主要上傳與產出介面。
   - `app/api/generateDescriptions/route.ts` 處理 AI 生成。
   - `app/api/s3-upload/route.ts` 處理圖片上傳。
   - 前端、API route、圖片儲存與 AI 呼叫放在一個小型 Next.js app 裡。
6. 可重用概念：
   - 「商品圖片 + 使用者輸入 + vision model -> 商品文案」的最小閉環。
   - 圖片上傳、預覽、API generation、loading state 的 MVP 節奏。
   - 多語輸出的產品方向。
7. 可重用功能：
   - 商品圖片上傳與 description generation 的使用者流程可參考。
   - API route 邊界可參考，但不能複製程式碼。
8. 不適合使用的地方：
   - repo 沒有明確 LICENSE 或 package license，不能直接複製程式碼。
   - 只產生描述，無法涵蓋 PAQ 的定位、競品、包裝、社群、FAQ、首月計畫等完整上市報告。
   - 圖片儲存依賴 S3，MVP 可先用本地或簡化方案。
9. license：未明確標示 license。
10. 是否適合整合進 PAQ Product Launch OS：適合參考 user flow 與 AI interaction pattern，不適合整合或複製程式碼。
11. 建議採用方式：reference only。
12. 對本專案的啟發：
   - PAQ MVP 可以先做「圖片上傳 + 文字欄位 + mock generation + report sections」；接真 AI 時再加入 vision model。
   - 圖片理解應是一個獨立 workflow step，而不是直接混在文案生成 prompt 裡。

## 5. mkhsu2002/AI-PM-Designer-Pro

1. repo 名稱：mkhsu2002/AI-PM-Designer-Pro
2. GitHub URL：https://github.com/mkhsu2002/AI-PM-Designer-Pro
3. 主要用途：AI 電商商品圖文生成工具，從產品圖產生行銷素材包、三條視覺策略路線、商品主圖、海報與介紹長圖。
4. 技術棧：TypeScript、React、Vite、Google Gemini API、Zod、JSZip。
5. 專案架構重點：
   - 單頁 React/Vite app。
   - `prompts.ts` 管理生成策略與提示。
   - `services/geminiClient.ts`、`services/geminiService.ts` 分離 AI provider 呼叫。
   - `types.ts` 定義生成輸入/輸出資料結構。
   - README 已標示 repo 停止開發，進階版本已商業化。
6. 可重用概念：
   - 三條策略路線並行產生，讓使用者比較不同定位與視覺方向。
   - 先產生策略，再產生素材的兩階段 workflow。
   - 對品牌背景、競品/文案參考、產品視覺分析做 context-aware input。
7. 可重用功能：
   - 視覺策略路線、素材包輸出、品牌 tone & manner 欄位可作為 PAQ 的報告區塊靈感。
   - AI provider service abstraction 可參考概念。
8. 不適合使用的地方：
   - repo 已停止開發，不應作為長期基礎。
   - 偏圖片素材生成，PAQ 需要更完整的商品上市生命週期。
   - 直接採用可能綁定特定 Gemini workflow。
9. license：MIT。
10. 是否適合整合進 PAQ Product Launch OS：適合參考 AI workflow 與輸出結構，不建議 fork。
11. 建議採用方式：copy concept。
12. 對本專案的啟發：
   - PAQ 可以在「商品定位」或「包裝設計 brief」中產生 2 到 3 條策略方向，讓使用者選擇主路線。
   - 報告不應只有單一答案；對不確定的品牌/客群問題，提供可比較方案會更有產品價值。

## 6. 302ai/302_ecom_image_generator

1. repo 名稱：302ai/302_ecom_image_generator
2. GitHub URL：https://github.com/302ai/302_ecom_image_generator
3. 主要用途：AI e-commerce scene image generator，根據商品圖或模特圖與場景描述，生成適用於電商的商品場景圖。
4. 技術棧：TypeScript、Next.js、React、Tailwind、Ant Design、Konva、Zustand、image cropper、image compare、zoom/pan、Docker。
5. 專案架構重點：
   - `src/app/` 使用 Next.js app 結構。
   - `src/components/` 包含 DropZone、ImageEditor、ImageUpscaler、PromptModal、SceneBar、RatioBar、HistoryDrawer 等圖片生成與編輯介面。
   - `src/store/` 管理全域狀態與 task state。
   - `src/libs/api.ts` 封裝 API 呼叫。
   - `src/locales/` 支援多語。
6. 可重用概念：
   - 商品圖片生成任務應有 task state、progress、history。
   - 圖片比例、場景、結果類型、裁切與比對是電商素材工具的常見控制項。
   - 生成後需要保存歷史，方便使用者回看與比較。
7. 可重用功能：
   - 可參考圖片工作區的 UI 控制分類：上傳、裁切、場景、比例、進度、歷史、比對。
   - 可參考多語架構概念。
8. 不適合使用的地方：
   - AGPL-3.0 license 對衍生作品有強 copyleft 義務，不適合直接整合進商業 SaaS MVP。
   - 聚焦商品場景圖生成，不涵蓋完整上市報告。
   - UI 控制較重，會讓 MVP 偏向圖片工具而非商品上市 OS。
9. license：AGPL-3.0。
10. 是否適合整合進 PAQ Product Launch OS：不適合直接整合；可作圖片素材子功能的概念參考。
11. 建議採用方式：reference only。
12. 對本專案的啟發：
   - PAQ 未來若加入 AI 圖片或包裝預覽，應把圖片任務拆成獨立子系統，不要塞進文字報告生成主流程。

## 7. assafelovic/gpt-researcher

1. repo 名稱：assafelovic/gpt-researcher
2. GitHub URL：https://github.com/assafelovic/gpt-researcher
3. 主要用途：autonomous deep research agent，可對 web/local data 進行 research，產生帶 citations 的研究報告，支援多 provider、backend、frontend、MCP 與 multi-agent。
4. 技術棧：Python、FastAPI/ASGI 相關 backend、Next.js frontend、LangGraph、LangChain 生態、Docker、WebSocket、SQLAlchemy、Pydantic、Tavily/search、MCP、Markdown/PDF/docx output。
5. 專案架構重點：
   - `gpt_researcher/` 為核心 research package。
   - `backend/` 提供 server、report type、chat、memory、WebSocket、report store。
   - `frontend/nextjs/` 提供 research UI、source cards、logs、report page。
   - `multi_agents/`、`multi_agents_ag2/` 提供 multi-agent workflow。
   - 支援不同 report type：basic、detailed、deep research。
6. 可重用概念：
   - research workflow 分為 planning、source gathering、summarization、report composition。
   - 每份報告應保存 sources、logs、intermediate state。
   - 對競品分析與市場研究尤其有啟發。
   - 報告需要 citation/source trace，降低 AI 幻覺。
7. 可重用功能：
   - 競品分析流程、source-backed report、research logs、report export 的概念可採用。
   - 可參考「報告類型」設計，PAQ 可有 MVP report、competitor report、launch plan report。
8. 不適合使用的地方：
   - 對 MVP 過重，直接整合會把產品變成 research agent platform。
   - PAQ 第一版可以 mock 競品分析，不必先做完整網路研究 agent。
   - 若未來接即時研究，要處理搜尋 API、引用、抓取條款與資料品質。
9. license：Apache-2.0。
10. 是否適合整合進 PAQ Product Launch OS：中期適合參考或部分整合研究流程；MVP 先不整合。
11. 建議採用方式：copy concept。
12. 對本專案的啟發：
   - PAQ 的「競品分析」不應只靠模型憑空生成。未來應有 source-backed workflow：使用者輸入競品、系統整理來源、報告標註哪些結論有來源。

## 8. lucasboscatti/sales-ai-agent-langgraph

1. repo 名稱：lucasboscatti/sales-ai-agent-langgraph
2. GitHub URL：https://github.com/lucasboscatti/sales-ai-agent-langgraph
3. 主要用途：使用 LangChain、LangGraph、Gemini Flash、SQLite 與 Streamlit 建立 virtual sales agent，可回答產品問題、建立訂單、查訂單與推薦商品。
4. 技術棧：Python、Streamlit、LangChain、LangGraph、Gemini/Vertex AI、SQLite、Pandas、Pydantic。
5. 專案架構重點：
   - `virtual_sales_agent/graph.py` 定義 agent graph。
   - `virtual_sales_agent/tools.py` 定義工具。
   - `database/` 管理 SQLite schema 與 sample products。
   - README 強調 safe tools 與 sensitive tools 分類，敏感工具需要 human-in-the-loop approval。
6. 可重用概念：
   - safe tools vs sensitive tools。
   - human-in-the-loop approval。
   - 用 graph 管理 agent state 與下一步動作。
   - 小型 local database 支援 agent 回答與操作。
7. 可重用功能：
   - 對 PAQ 的「發布、上架、改價、投廣告」等敏感動作有設計參考。
   - 可參考 agent graph 概念，不直接複製實作。
8. 不適合使用的地方：
   - 主要是 customer-facing sales assistant，不是商品企劃系統。
   - Streamlit 適合 demo，不一定適合 PAQ 正式 SaaS UI。
   - sample database 與訂單工具與 MVP 無直接關係。
9. license：MIT。
10. 是否適合整合進 PAQ Product Launch OS：不整合；可參考 human-in-the-loop 與工具風險分級。
11. 建議採用方式：copy concept。
12. 對本專案的啟發：
   - PAQ 應將 workflow step 分級：低風險產出文字、中風險修改報告、高風險對外發布或平台操作。高風險必須保留人工確認。

## 9. langchain-ai/langgraph

1. repo 名稱：langchain-ai/langgraph
2. GitHub URL：https://github.com/langchain-ai/langgraph
3. 主要用途：低階 agent orchestration framework，用於建立 stateful、long-running、durable、human-in-the-loop 的 AI workflow/agent。
4. 技術棧：Python、LangChain ecosystem、checkpointer、Postgres/SQLite checkpoint package、SDK、CLI、JS/TS examples。
5. 專案架構重點：
   - `libs/langgraph/` 是核心 Python package。
   - `libs/checkpoint/`、`libs/checkpoint-postgres/`、`libs/checkpoint-sqlite/` 管理 checkpoint。
   - `libs/cli/` 提供部署與範例。
   - `libs/sdk-py/`、`libs/sdk-js/` 提供 SDK。
   - README 強調 durable execution、human-in-the-loop、memory、debugging、production deployment。
6. 可重用概念：
   - PAQ 的 report generation 可以是 state graph，而不是一個超長 prompt。
   - 每個 workflow step 可以保存狀態、錯誤與輸出。
   - 支援人類在中途修改 input、重新產生某區塊、通過或退回。
7. 可重用功能：
   - 接真 AI API 後，可考慮使用 LangGraph 管理工作流。
   - 特別適合競品研究、報告生成、合規檢查、匯出前審核這類多步驟流程。
8. 不適合使用的地方：
   - MVP mock workflow 不一定需要 LangGraph，否則初期複雜度會上升。
   - 如果本專案選擇全 TypeScript stack，需評估 LangGraph.js 或自行簡化 state machine。
9. license：MIT。
10. 是否適合整合進 PAQ Product Launch OS：中期適合整合；MVP 可以先用自建 workflow interface，保留替換成 LangGraph 的空間。
11. 建議採用方式：copy concept；後續視技術棧可 package integration。
12. 對本專案的啟發：
   - PAQ 應把 AI pipeline 設計成可觀察、可重跑、可審核的 workflow。每個報告區塊應知道自己來自哪個 step、用到哪些 input、風險等級為何。

## 10. Dokuly-PLM/dokuly

1. repo 名稱：Dokuly-PLM/dokuly
2. GitHub URL：https://github.com/Dokuly-PLM/dokuly
3. 主要用途：開源 Product Lifecycle Management system，用於產品資料、BOM、revision control、documents、requirements、projects、release management、inventory、API 等 PLM 工作。
4. 技術棧：Django、Django REST Framework、PostgreSQL、React、Vite、Docker Compose、React Table、React PDF、Three.js、PDF/QR/barcode/CSV 等多種工具。
5. 專案架構重點：
   - `dokuly/` 是 Django backend，包含 accounts、assemblies、documents、projects、requirements、API 等多個 app。
   - `DokulyAPI/` 提供 API/migration examples。
   - `default_schema.sql` 展示完整 PostgreSQL schema dump。
   - 前端 React/Vite 與 backend Django 共同存在。
   - README 強調 part numbering、BOM management、revision control、change history、release management。
6. 可重用概念：
   - lifecycle 狀態、revision、release、change history。
   - 文件與產品資料之間的關聯。
   - 對「商品上市報告版本管理」與「審核通過後 release」很有啟發。
7. 可重用功能：
   - 可以參考 revision/release/change history 的產品概念。
   - 對 PAQ 未來做多版本商品企劃、包裝版次、上架版次有幫助。
8. 不適合使用的地方：
   - GPL-3.0 license，不適合直接整合進商業閉源 SaaS。
   - PLM 系統範圍遠大於 PAQ MVP。
   - BOM、零件、工程文件、庫存等功能不是第一版重點。
9. license：GPL-3.0。
10. 是否適合整合進 PAQ Product Launch OS：不整合；只參考 PLM 概念。
11. 建議採用方式：reference only。
12. 對本專案的啟發：
   - PAQ 應保留 report revision 與 approval history，未來可追蹤「哪一版文案被匯出、哪一版包裝 brief 被通過」。

## 最推薦參考的前 5 個 repo

1. langchain-ai/langgraph
   - 原因：最能支撐 PAQ 後續真 AI API 的多步驟、可重跑、可審核 workflow。
   - 採用方式：MVP 先 copy concept，中期再評估 LangGraph 或 LangGraph.js 整合。

2. assafelovic/gpt-researcher
   - 原因：競品分析與市場研究需要 source-backed workflow，不能只靠模型幻想。
   - 採用方式：copy concept；未來為 PAQ 建立 competitor research pipeline。

3. medusajs/medusa
   - 原因：commerce domain model 與模組化架構很成熟，適合 PAQ 未來擴展商品、價格、sales channel。
   - 採用方式：copy concept；短期不要整合。

4. mkhsu2002/AI-PM-Designer-Pro
   - 原因：三條策略路線、品牌背景、競品參考、視覺行銷素材包非常貼近 PAQ 的商品上市場景。
   - 採用方式：copy concept；因 repo 已停止開發，不建議 fork。

5. Nutlope/description-generator
   - 原因：最小化展示「商品圖片上傳 -> vision model -> 商品描述」的使用者流程。
   - 採用方式：reference only；因 license 未明，不複製程式碼。

特別備註：Shopify/shop-chat-agent 對未來 Shopify app 與 MCP tool integration 很有價值，但 license 限制明顯，不列入通用 MVP 前 5。

## 不建議使用的 repo 與原因

1. 302ai/302_ecom_image_generator
   - 原因：AGPL-3.0，不適合直接整合進商業 SaaS；功能偏圖片生成，不是 PAQ MVP 主軸。
   - 可保留：圖片任務進度、比例、場景、歷史紀錄等 UX 概念。

2. Dokuly-PLM/dokuly
   - 原因：GPL-3.0，範圍是完整 PLM，對 MVP 過重。
   - 可保留：revision、release、change history 概念。

3. Shopify/shop-chat-agent
   - 原因：授權限制只能用於 Shopify software/services integration/interoperation，不適合通用商品上市 OS 直接使用。
   - 可保留：MCP tools、chat backend、safe/sensitive tool boundary。

4. Nutlope/description-generator
   - 原因：未明確標示 license，不應直接複製程式碼。
   - 可保留：圖片上傳到 AI description 的流程概念。

5. Shopify/Shopify-AI-Toolkit
   - 原因：它是開發工具 plugin，不是 end-user SaaS。
   - 可保留：平台 ruleset、schema validation、agent tool packaging 思維。

## PAQ Product Launch OS 可以採用的架構草案

### 核心產品架構

建議第一版採用單體 web app，但內部模組要清楚切分：

1. Web UI
   - 商品專案列表
   - 商品資料輸入表單
   - 圖片上傳與預覽
   - 生成進度頁
   - 報告檢視與編輯頁
   - Markdown 匯出

2. Domain layer
   - ProductProject
   - ProductInput
   - ProductImage
   - CompetitorReference
   - LaunchReport
   - ReportSection
   - GenerationRun
   - WorkflowStep
   - ExportRecord

3. Workflow layer
   - 第一版使用 mock workflow。
   - 每個 step 回傳結構化結果，不直接把所有內容塞在單一文字欄位。
   - 未來可替換為 LangGraph 或自建 state machine。

4. AI provider layer
   - 第一版不接真 AI。
   - 第 6 階段再加入 OpenAI、Gemini 或其他 provider。
   - provider 需封裝在 service boundary，避免 UI 或 domain model 綁死特定模型。

5. Risk and review layer
   - 對食品、美妝、醫療、保健、定價、商標、包裝圖像、平台規則做 risk flags。
   - 報告區塊要有 review status：待審核、已修改、已通過。
   - 高風險操作未來都要 human approval。

### 建議資料模型草案

1. `ProductProject`
   - id
   - name
   - category
   - stage
   - salesPlatform
   - status
   - createdAt
   - updatedAt

2. `ProductInput`
   - id
   - projectId
   - productName
   - category
   - features
   - cost
   - expectedPrice
   - targetAudience
   - brandStyle
   - specs
   - usageNotes
   - warnings
   - market

3. `ProductImage`
   - id
   - projectId
   - fileName
   - url
   - mimeType
   - sortOrder
   - createdAt

4. `CompetitorReference`
   - id
   - projectId
   - name
   - url
   - notes
   - sourceType

5. `LaunchReport`
   - id
   - projectId
   - version
   - status
   - generatedBy
   - generatedAt

6. `ReportSection`
   - id
   - reportId
   - sectionType
   - title
   - content
   - reviewStatus
   - riskLevel
   - riskNotes
   - sourceRefs
   - updatedAt

7. `GenerationRun`
   - id
   - projectId
   - reportId
   - workflowVersion
   - status
   - startedAt
   - completedAt
   - errorMessage

8. `WorkflowStep`
   - id
   - generationRunId
   - stepName
   - status
   - inputSnapshot
   - outputSnapshot
   - startedAt
   - completedAt

### 建議 AI workflow 草案

第一版 mock workflow 可以先模擬以下步驟：

1. Input validation
   - 檢查必填欄位與缺漏資訊。

2. Product understanding
   - 整理商品類別、功能、特色、規格與限制。

3. Risk classification
   - 判斷是否涉及食品、美妝、醫療、保健、商標、平台規則等高風險。

4. Positioning and audience
   - 產出商品定位、目標客群、核心賣點。

5. Competitor framing
   - 根據使用者輸入的競品名稱或連結產生初步比較，不假裝已完成網路查證。

6. Pricing recommendation
   - 根據成本與預計售價計算毛利率，提出價格帶與注意事項。

7. Packaging brief
   - 產出包裝設計 brief、正面文案、背面文案。

8. Listing copy
   - 產出商品頁標題、短描述、長描述、規格表、SEO 關鍵字。

9. Social content
   - 產出 IG、Threads、TikTok 文案與短影音腳本。

10. Customer support
   - 產出 FAQ 與客服回覆話術。

11. Launch operations
   - 產出上架檢查清單與首月行銷計畫。

12. Optimization plan
   - 產出銷售後優化建議。

13. Final compliance pass
   - 對高風險區塊加上人工審核提示。

## 下一步實作建議

1. 第 2 階段先建立系統架構文件，不急著寫程式。
   - `docs/system-architecture.md`
   - `docs/data-model.md`
   - `docs/ai-workflow.md`
   - `docs/tech-decisions.md`

2. 技術棧建議先選簡潔 MVP：
   - Web：Next.js 或 Vite + React。
   - Language：TypeScript。
   - DB：PostgreSQL + Prisma，或第一版 SQLite + Prisma。
   - AI workflow：先自建 mock workflow interface，未來替換 LangGraph。
   - Export：先 Markdown，後續 PDF。

3. 第 3 階段建立 database schema 時，先圍繞商品專案與報告區塊，不做訂單、庫存、金流。

4. 第 4 階段 MVP UI 應先做真實可用流程：
   - project list
   - product input form
   - image upload preview
   - generation progress
   - report section editor
   - review status controls
   - Markdown export

5. 第 5 階段 mock AI workflow 應輸出固定 20 個 section，並加入風險標記。

6. 第 6 階段接真 AI API 時，優先做到：
   - structured output schema
   - retry/error handling
   - generation logs
   - section-level regeneration
   - source-aware competitor analysis

7. 不要在 MVP 前整合：
   - Shopify app
   - 自動上架
   - 自動投廣告
   - AI 圖片生成
   - 完整 PLM
   - 完整 research agent

