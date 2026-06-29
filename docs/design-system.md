# Frontend Design System

## 設計目標

PAQ Product Launch OS 採用安靜、清楚、可長時間閱讀的產品介面：

- 乾淨：使用明確留白、細邊框與有限陰影，不堆疊裝飾卡片。
- 科技感：以深墨色、teal 狀態色與精準資訊層級表現，不依賴霓虹或複雜動畫。
- 商業產品感：Dashboard 適合掃讀，報告適合討論、審核與匯出。
- 手機版可讀：320px 起不產生整頁水平捲動，按鈕最小高度 44px。
- 正式企劃書感：報告以摘要、章節、列表、審核狀態與風險提醒分層。

## Layout 原則

- Mobile-first；基礎樣式為單欄，空間足夠時才增加欄數。
- `ContentContainer` 與 `.content-container` 統一使用 `max-w-7xl`、置中與 responsive padding。
- 一般頁面垂直間距使用 `py-8 sm:py-10 lg:py-12`；首頁 band 使用 `.section-spacing`。
- Page section 保持 unframed；Card 僅用於重複商品、摘要數據、報告 section 與工具。
- Card 內距以 `p-5 sm:p-6` 為主，內部 gap 以 12px、16px、20px 為主。
- Grid：手機單欄、平板雙欄、桌機三欄；固定格式內容使用明確 grid tracks 與 `minmax(0, 1fr)`。

## Breakpoints

本專案沿用 Tailwind CSS breakpoints：

| 名稱 | 起始寬度 | 用途 |
| --- | ---: | --- |
| base | 0px | 手機單欄、按鈕滿寬或可換行 |
| sm | 640px | 大手機、雙按鈕與較寬 padding |
| md | 768px | 平板雙欄 grid |
| lg | 1024px | 筆電分欄、報告目錄 |
| xl | 1280px | 桌機三欄、表單側欄 sticky |

## Component 原則

- `AppShell`：唯一全站 shell，包含 skip link、Header 與 main landmark。
- `ContentContainer`：統一最大寬度與左右 padding。
- `PageHeader`：頁面 title、description、eyebrow / badge 與 actions。
- `SectionHeader`：首頁與工作頁 section 的標題、說明與 optional action。
- `FeatureCard`：首頁功能卡沿用 `Card`，保持等高與簡短描述，不另造專用抽象。
- `ProductCard`：Demo 與 Dashboard 共用，支援圖片、價格、建立時間、審核數與 lifecycle。
- `ReportSectionCard`：統一 title、description、status、actions、copy 與長內容容器。
- `StatusBadge`：只表達 demo、mock、AI、fallback 與 review 狀態。
- `EmptyState`：Dashboard、報告與商品找不到資料時提供下一步。
- `CopyButton`：統一 Clipboard API、fallback 與 copied 狀態。
- `ExportButtonGroup`：模板匯出使用 responsive grid，手機不固定單行。
- `LifecycleProgress`：完整模式在手機可水平滑動；Card 內使用 compact 模式。

## 防止版面跑掉

- 所有圖片使用 Next Image，外層固定 `aspect-ratio`；`fill` 不可缺少有尺寸的 relative container。
- Card、grid item 與文字容器使用 `min-w-0`；長 URL、英文與商品名使用 `break-words`。
- 摘要使用 `whitespace-pre-wrap`，不把整份報告塞成一段連續文字。
- 長列表使用 list/card 呈現；FAQ、社群文案與影片腳本可自然增加高度。
- Button 使用 `min-height` 而不是固定 `height`，手機可換行，觸控高度至少 44px。
- Loading state 保留接近完成畫面的高度與 skeleton，避免 localStorage hydrate 後大幅跳動。
- Lifecycle 在窄螢幕只讓進度元件自身水平 scroll，不讓整頁水平 overflow。
- 表格若未來加入，手機應改卡片或包在 `overflow-x-auto` 容器中。
- Absolute positioning 只用於固定比例圖片 overlay，不用於主要文案或控制列。

## Accessibility

- 每頁只有 AppShell 的 `main` landmark，頁面內容以 section / header / article 組織。
- 表單 label 透過 `htmlFor` 對應 input id；dynamic message 使用 `aria-live`。
- Icon-only 狀態需 `aria-label`；裝飾 icon 使用 `aria-hidden`。
- Focus ring 使用 teal，不移除 keyboard focus。
- 支援 `prefers-reduced-motion`，停用非必要動畫與長 transition。
