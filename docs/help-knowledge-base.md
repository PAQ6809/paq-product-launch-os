# PAQ AI Help Knowledge Base

這份文件對應 `lib/help/help-knowledge-base.ts`，是 v0.4.6 AI Help Center 的第一版固定知識庫。Help 助理只應根據這些產品資訊、目前頁面與最小帳號摘要回答，不應變成一般聊天機器人。

## 產品定位

PAQ Product Launch OS 的第一版定位是：

> 上傳商品資料，AI 產出完整商品上市企劃書。

適合小品牌、文創商品、3C 配件、生活選物、香氛禮盒、學生創業專案與電商賣家。

## 建立商品與 Autosave

使用者可在 `/products/new` 輸入商品名稱、商品類別、商品功能、成本、預計售價、目標客群、品牌風格、銷售平台與圖片。

匿名使用者會先使用本機草稿與 demo flow。登入後可將匿名草稿匯入 workspace，未來由 Supabase 保存商品、草稿與報告。

## AI 報告與 Provider Fallback

商品上市報告必須透過 server-side API route 產生，不可由前端直接呼叫 OpenAI 或 NVIDIA。

目前 report provider 可切換：

- `mock`
- `openai`
- `nvidia`

沒有 API key、provider 回傳格式錯誤、validator 失敗、或 production 未啟用 public real AI 時，系統會 fallback 到 Mock provider 並回傳 warning metadata。

## 報告審核、Copy 與 Legal Risk Notes

報告頁每個 section 支援：

- Copy
- Edit
- Approve
- Reject

人工修改會標記 `human_edited`。`legalRiskNotes` 會提醒 AI 內容需人工審核、包裝設計與圖片素材需確認商用授權、食品/美妝/保健/醫療商品不得宣稱療效，且上架前需依平台規則與當地法規檢查。

## 匯出格式

目前支援：

- Markdown
- JSON
- HTML
- CSV summary
- ZIP package
- Shopify 商品頁模板
- Shopee 商品頁模板
- Pinkoi 商品頁模板
- Amazon-style English listing
- Etsy-style English listing
- 社群貼文包

Roadmap：

- PDF
- DOCX
- PPTX

## Report Collections 與 Product Matrix

Report Collections 可將多個商品整理成一份多產品報告書。Product Matrix 可比較商品定位、價格、客群、上市狀態、風險與下一步建議。

## Locale、Translation 與 RTL

PAQ 使用 locale-prefixed routes。已啟用主要 demo locale：`zh-TW`、`en`、`ja`、`ko`、`ar`。Arabic 使用 RTL。報告翻譯仍需 human review，且不可新增原文沒有的功效、療效或銷售保證。

## Auth、資料保存與匿名草稿

匿名使用者可體驗 demo、本機草稿、mock report 與匯出。登入後才會把商品、報告、report collections、匯出工作與安全事件保存到 Supabase workspace。

Help 助理如果需要回答「我的歷史產品在哪裡？」這類問題，只能使用最小帳號摘要，例如 product count、latest draft exists、latest product updated at、recent export count。

## Security、Privacy、RLS、Encryption、Audit

所有第三方 AI API key 只放在 server-side 環境變數。登入後資料以 Supabase RLS 依 `user_id` 隔離。敏感報告可使用 encryption helper 設計加密保存。安全中心提供資料匯出與刪除請求。

AI Help v1 不保存完整對話，只可保存 metadata audit event，例如 scope、provider、fallback、currentPath、createdAt。

## FAQ

- 如何建立產品？
- 報告可以匯出哪些格式？
- 為什麼我需要登入？
- 草稿會自動保存嗎？
- 我的資料安全嗎？
- 如何建立多產品報告書？
