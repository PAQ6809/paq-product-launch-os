# PAQ Product Launch OS v0.3 AI Integration

## 目標

v0.3 將原本的 mock AI workflow 升級成可切換 provider 的架構：

- `MockAIProvider`：保留 demo 與無 API key fallback。
- `OpenAIProvider`：在 server-side 呼叫 OpenAI API，產生真實商品上市企劃報告。
- `NvidiaProvider`：透過 NVIDIA OpenAI-compatible endpoint 呼叫 `minimaxai/minimax-m2.7`。
- `/api/generate-report`：唯一的 AI 生成入口，前端不得直接呼叫 OpenAI。

## Provider 架構

核心檔案：

- `lib/ai/provider.ts`：定義 `AIProvider` interface、`GenerateLaunchReportInput`、API response type。
- `lib/ai/mock-provider.ts`：封裝現有 mock report generator。
- `lib/ai/openai-provider.ts`：server-only OpenAI provider。
- `lib/ai/nvidia-provider.ts`：server-only NVIDIA MiniMax provider。
- `lib/ai/get-provider.ts`：根據環境變數選擇 provider。
- `lib/ai/schemas/launch-report-json-schema.ts`：LaunchReport Structured Outputs JSON Schema。
- `app/api/generate-report/route.ts`：接收商品資料，呼叫 provider，回傳 report。

選擇邏輯：

```text
AI_PROVIDER=openai 且 OPENAI_API_KEY 存在
→ 使用 OpenAIProvider

AI_PROVIDER=nvidia 且 NVIDIA_API_KEY 存在
→ 使用 NvidiaProvider

其他狀況
→ 使用 MockAIProvider
```

## 環境變數

本機建立 `.env.local`：

```env
AI_PROVIDER=mock
OPENAI_API_KEY=
NVIDIA_API_KEY=
NVIDIA_MODEL=minimaxai/minimax-m2.7
NVIDIA_MAX_TOKENS=4096
```

要測試 OpenAIProvider：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=你的_api_key
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` 可省略，程式會使用預設模型。正式部署時請在 Vercel Environment Variables 設定，不要把 key 寫進 repo。

要測試 NVIDIA MiniMax：

```env
AI_PROVIDER=nvidia
NVIDIA_API_KEY=你的_nvidia_api_key
NVIDIA_MODEL=minimaxai/minimax-m2.7
NVIDIA_MAX_TOKENS=4096
```

NVIDIA Build 頁面目前標示 Free Endpoint Available，但額度、速率、模型供應與使用條款仍由 NVIDIA 控制，不能視為永久、無限制保證。

## Fallback 機制

API route 會在以下情況 fallback 到 `MockAIProvider`：

- `AI_PROVIDER=openai` 但沒有 `OPENAI_API_KEY`
- `AI_PROVIDER=nvidia` 但沒有 `NVIDIA_API_KEY`
- OpenAI API 回傳錯誤
- NVIDIA API 回傳錯誤或不是合法 JSON
- OpenAI 回傳不是合法 JSON
- validator 判定欄位缺失或型別錯誤
- OpenAI 回傳包含不允許的高風險宣稱

fallback 時仍回傳 HTTP 200 與完整 `LaunchReport`，並包含：

```json
{
  "provider": "mock",
  "requestedProvider": "openai",
  "isFallback": true,
  "model": "paq-mock-v1",
  "generatedAt": "2026-06-22T00:00:00.000Z",
  "validationPassed": true,
  "warning": "..."
}
```

## Validator 機制

`lib/ai/validators/launch-report-validator.ts` 會檢查：

- 必要欄位是否存在
- 陣列欄位是否為非空陣列
- 所有必要字串是否為非空字串
- `legalRiskNotes` 是否存在且為非空字串陣列
- `pricingStrategy` 是否包含數字與說明
- `packagingBrief` 是否包含概念、視覺方向、材質、必要元素與合規提醒
- 社群貼文、短影音腳本、FAQ、客服話術、首月行銷計畫與優化建議是否符合資料結構
- 對外商品文案是否包含「保證療效」「治療」「改善疾病」「保證銷售」「月收保證」「guaranteed sales」「cure」「treat disease」「clinically proven」

OpenAI 回傳若不符合 `LaunchReport` type，不會直接進入 UI，而是 fallback 到 mock report。

高風險詞檢查不掃描 `legalRiskNotes` 與包裝合規警語，避免「不得宣稱治療」這類正確警告被誤判；它只檢查實際可能對外使用的商品與行銷文案。

## Prompt 與 JSON Output

Prompt 分成：

- `product-launch-system-prompt.ts`：角色、語氣、安全規則、禁止宣稱。
- `product-launch-user-prompt.ts`：商品資料與 JSON schema instruction。

OpenAIProvider 使用 Responses API Structured Outputs：

```ts
text: {
  format: {
    type: "json_schema",
    name: "paq_launch_report",
    schema: LAUNCH_REPORT_JSON_SCHEMA,
    strict: true
  }
}
```

temperature 設為 `0.1`。JSON Schema 對所有物件設定 `additionalProperties: false`，所有 LaunchReport 欄位都列為 required，並加入 `legalRiskNotes`。

## 為什麼 Structured Outputs 後仍需要 validator

Structured Outputs 只負責讓 OpenAI 回傳符合 JSON Schema，不能取代應用程式層的檢查：

- provider、模型或 API 版本可能發生變化。
- schema 正確不代表字串有商業價值或沒有高風險宣稱。
- NVIDIA MiniMax endpoint 目前沒有在官方 request schema 宣告 `response_format` / `json_schema`。
- localStorage、mock data 或未來其他 provider 仍可能提供錯誤資料。

因此所有 provider 回傳後都會再跑 `validateLaunchReportPayload`；驗證失敗就 fallback 到 MockAIProvider。

## NVIDIA MiniMax 的 JSON 策略

`NvidiaProvider` 使用 `https://integrate.api.nvidia.com/v1/chat/completions` 與模型 `minimaxai/minimax-m2.7`。因 NVIDIA 官方模型 request schema 目前沒有列出 Structured Outputs 參數，實作採用：

1. system prompt 禁止 Markdown 與多餘文字。
2. 以單一 `submit_launch_report` function tool 的 parameters 傳入 LaunchReport JSON Schema。
3. 優先解析 tool call arguments；若模型沒有呼叫 tool，才解析文字 JSON。
4. 文字 parser 依序嘗試原始文字、移除 code fence、擷取第一個完整 JSON object。
5. 最後一定通過同一套 validator，否則 fallback。

這條路徑是 prompt-constrained JSON，不標示為 OpenAI Structured Outputs。

實測 MiniMax M2.7 最小 JSON 呼叫可成功，但完整 LaunchReport 可能因 reasoning 延遲、token 上限或 JSON arguments 不完整而進入 fallback。它適合作為可選 provider 與研究路徑；展示流程仍應保留 MockAIProvider，不能把 free preview endpoint 當成永久、無限制或固定低延遲服務。

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

NVIDIA provider：

```powershell
$env:AI_PROVIDER="nvidia"
$env:NVIDIA_API_KEY="你的_nvidia_api_key"
$env:NVIDIA_MODEL="minimaxai/minimax-m2.7"
$env:NVIDIA_MAX_TOKENS="4096"
npm run dev
```

成功時 `/api/generate-report` metadata 應包含：

```json
{
  "provider": "nvidia",
  "requestedProvider": "nvidia",
  "isFallback": false,
  "model": "minimaxai/minimax-m2.7",
  "validationPassed": true
}
```

## 常見錯誤排查

- `OPENAI_API_KEY is missing`：確認 server-side 環境變數，並重啟 dev server。
- `NVIDIA_API_KEY is missing`：確認 NVIDIA key 只放在 `.env.local` 或部署平台 secret。
- `JSON validation failed`：檢查缺少欄位、空陣列、空字串、`legalRiskNotes` 或高風險詞。
- Structured Outputs 400：確認 OpenAI model 支援 Structured Outputs，且 schema 所有物件都有 `additionalProperties: false`。
- NVIDIA 401/403：key 無效、已撤銷或沒有該 endpoint 權限。
- NVIDIA 429：free endpoint 仍可能有速率或服務限制，稍後重試或改用 mock。
- timeout：提高 `OPENAI_TIMEOUT_MS` 或 `NVIDIA_TIMEOUT_MS`，但仍應保留 fallback。
