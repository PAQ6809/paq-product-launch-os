# PAQ v0.4 Persistence 與 Autosave

v0.4 的保存策略是 local-first、cloud-enhanced：匿名 demo 必須永遠可用，登入後才把商品、草稿與報告同步到 Supabase。

## 儲存層

本機：

- `lib/storage/local-demo-store.ts`：Demo 與使用者建立商品。
- `lib/storage/local-report-store.ts`：商品上市報告。
- `lib/storage/local-translation-store.ts`：翻譯結果。
- `lib/autosave/local-draft.ts`：匿名商品輸入草稿。

雲端：

- `products`：商品基本資料與生命週期狀態。
- `product_drafts`：商品輸入頁 autosave 草稿。
- `launch_reports`：AI/Mock 商品上市報告。
- `report_translations`：未來保存多語報告翻譯。
- `workspace_events`：建立、更新、autosave、報告保存等事件。

## Autosave Flow

1. 使用者在 `/products/new` 輸入商品資料。
2. `useAutosaveProductDraft` debounce 後保存到 localStorage。
3. 如果已登入，hook 會呼叫 `POST /api/drafts` 嘗試同步雲端。
4. 如果 API 回傳 401 或網路失敗，畫面標示 local-only，但不阻擋使用者。
5. 重新整理後，`ResumeDraftBanner` 可載入本機草稿。
6. 登入後可用 `SyncAnonymousDraftDialog` 將匿名草稿匯入 Supabase。

## 表單送出 Flow

1. 先用目前草稿建立 local product。
2. 嘗試 `POST /api/products` 建立 cloud product。
3. 若 cloud 成功，報告與導向路徑使用 cloud product id。
4. 若 cloud 失敗或未登入，沿用 local product id。
5. 呼叫 `POST /api/generate-report` 產生報告。
6. 報告先寫 localStorage。
7. 若有 cloud product，嘗試 `POST /api/reports` 保存雲端。
8. 任何 cloud 寫入失敗都不阻斷 demo。

## UI 狀態

`AutosaveIndicator` 顯示：

- `Autosaving`
- `Saved locally`
- `Saved to cloud`
- `Local draft only`

Dashboard 與商品歷史頁會顯示：

- `Local demo workspace`
- `Cloud workspace`

## 取捨

v0.4 刻意保留重複的 localStorage 與 cloud persistence，原因是 demo 現場不能因為登入、Supabase 設定或網路問題失效。Supabase 是增強，不是 demo 的單點故障。

## 已知限制

- localStorage 只在同一台裝置與瀏覽器可用。
- in-memory rate limit 不適合正式 production quota。
- report section review state 尚未保存到資料庫。
- translation cloud persistence 已有 schema，但 v0.4 UI 仍以 localStorage cache 為主。
- 匿名草稿 import 第一版只同步 draft，不自動建立完整 product。

## Production 建議

- 啟用 Supabase RLS 並先用測試帳號驗證跨帳號不可讀寫。
- 在 Vercel 設定 Supabase env，不要提交 `.env.local`。
- 公開 demo 仍建議保留 `AI_PROVIDER=mock` 與 `ENABLE_PUBLIC_REAL_AI=false`。
- 若要封閉測試真 AI，請搭配登入、rate limit、quota 與 workspace event log。
