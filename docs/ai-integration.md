# PAQ Product Launch OS v0.3 AI Integration

## 目標

v0.3 將原本的 mock AI workflow 升級成可切換 provider 的架構：

- `MockAIProvider`：保留 demo 與無 API key fallback。
- `OpenAIProvider`：在 server-side 呼叫 OpenAI API，產生真實商品上市企劃報告。
- `/api/generate-report`：唯一的 AI 生成入口，前端不得直接呼叫 OpenAI。

## Provider 架構

核心檔案：

- `lib/ai/provider.ts`：定義 `AIProvider` interface、`GenerateLaunchReportInput`、API response type。
- `lib/ai/mock-provider.ts`：封裝現有 mock report generator。
- `lib/ai/openai-provider.ts`：server-only OpenAI provider。
- `lib/ai/get-provider.ts`：根據環境變數選擇 provider。
- `app/api/generate-report/route.ts`：接收商品資料，呼叫 provider，回傳 report。

選擇邏輯：

```text
AI_PROVIDER=openai 且 OPENAI_API_KEY 存在
→ 使用 OpenAIProvider

其他狀況
→ 使用 MockAIProvider
```

## 環境變數

本機建立 `.env.local`：

```env
AI_PROVIDER=mock
OPENAI_API_KEY=
```

要測試 OpenAIProvider：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=你的_api_key
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` 可省略，程式會使用預設模型。正式部署時請在 Vercel Environment Variables 設定，不要把 key 寫進 repo。

## Fallback 機制

API route 會在以下情況 fallback 到 `MockAIProvider`：

- `AI_PROVIDER=openai` 但沒有 `OPENAI_API_KEY`
- OpenAI API 回傳錯誤
- OpenAI 回傳不是合法 JSON
- validator 判定欄位缺失或型別錯誤
- OpenAI 回傳包含不允許的高風險宣稱

fallback 時仍回傳 HTTP 200 與完整 `LaunchReport`，並包含：

```json
{
  "provider": "mock",
  "requestedProvider": "openai",
  "isFallback": true,
  "warning": "..."
}
```

## Validator 機制

`lib/ai/validators/launch-report-validator.ts` 會檢查：

- 必要欄位是否存在
- 陣列欄位是否為非空陣列
- `pricingStrategy` 是否包含數字與說明
- `packagingBrief` 是否包含概念、視覺方向、材質、必要元素與合規提醒
- 社群貼文、短影音腳本、FAQ、客服話術、首月行銷計畫與優化建議是否符合資料結構

OpenAI 回傳若不符合 `LaunchReport` type，不會直接進入 UI，而是 fallback 到 mock report。

## Prompt 與 JSON Output

Prompt 分成：

- `product-launch-system-prompt.ts`：角色、語氣、安全規則、禁止宣稱。
- `product-launch-user-prompt.ts`：商品資料與 JSON schema instruction。

OpenAIProvider 使用 JSON schema output，並把 temperature 設低，降低內容飄移。

## AI 內容審核注意事項

AI 產出內容只能作為企劃草稿。正式對外使用前需人工審核：

- 商品資訊是否真實
- 價格、規格、材質、內容物是否正確
- 包裝設計、圖片、字體、插圖、音樂是否具商用授權
- 商標與競品比較是否安全
- 平台規則是否允許該類商品與宣稱

## 食品、美妝、保健、醫療風險

以下商品需額外小心：

- 食品、飲品、保健品
- 美妝、保養、香氛、精油
- 醫療器材、健康管理、身體接觸商品

不得宣稱：

- 保證有效
- 治療
- 改善疾病
- 醫療功效
- 保證銷售
- 月收保證

若商品類別涉及上述風險，OpenAIProvider 會自動加入人工審核與法規提醒。

## 為什麼不能在前端呼叫 OpenAI API

前端程式碼會被瀏覽器下載，任何放在 client component、bundle、localStorage 或公開環境變數中的 API key 都可能外洩。

正確做法：

1. 前端只呼叫 `/api/generate-report`。
2. API route 在 server-side 讀取 `process.env.OPENAI_API_KEY`。
3. OpenAIProvider 只存在 server-only module。
4. 回傳給前端的只有 report、provider、fallback 與 warning，不包含任何 secret。

## 測試方式

Mock provider：

```powershell
$env:AI_PROVIDER="mock"
npm run dev
```

打開 `/products/new` 建立商品，報告應可正常產生，provider 會顯示 `MockAIProvider`。

OpenAI provider：

```powershell
$env:AI_PROVIDER="openai"
$env:OPENAI_API_KEY="你的_api_key"
npm run dev
```

建立商品後，API route 會呼叫 OpenAI。若 OpenAI 回傳不合法或 API 失敗，頁面仍會顯示 mock fallback 報告與 warning。
