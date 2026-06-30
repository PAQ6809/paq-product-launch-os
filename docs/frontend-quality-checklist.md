# Frontend Quality Checklist

## Responsive

- [ ] 320px 至 1440px 沒有整頁水平 overflow。
- [ ] Grid 依 base / md / lg / xl 正確切換欄數。
- [ ] CTA、review、translation 與 export controls 可換行。
- [ ] Header、sticky aside 與 lifecycle 不遮擋內容。

## Layout Stability

- [ ] Next Image 外層都有固定 aspect ratio 或尺寸。
- [ ] 圖片 placeholder 與實際圖片高度一致。
- [ ] LocalStorage loading state 保留內容空間。
- [ ] 動態 message 使用預留區域或不影響主要控制位置。
- [ ] 沒有以 absolute positioning 排主要文案或按鈕。

## Component Consistency

- [ ] 頁面使用 AppShell、ContentContainer 與 PageHeader。
- [ ] Section title 使用 SectionHeader 或一致層級。
- [ ] 商品使用 ProductCard，報告章節使用 ReportSectionCard。
- [ ] Copy 使用 CopyButton，狀態使用 StatusBadge。
- [ ] Card radius 不超過 8px，padding 與 gap 一致。

## Accessibility

- [ ] 頁面有 skip link、Header、nav、main、section 與 article landmarks。
- [ ] Button 有文字或 aria-label，裝飾 icon 使用 aria-hidden。
- [ ] Image alt 描述商品或畫面用途。
- [ ] Form label 與 input id 正確連結。
- [ ] Keyboard focus 清楚，Tab 順序符合畫面流程。
- [ ] 文字與背景對比可讀，reduced motion 生效。

## Report Readability

- [ ] 上市摘要、lifecycle、匯出與翻譯控制順序清楚。
- [ ] 長內容使用 break-words 與 whitespace-pre-wrap。
- [ ] 多行內容以列表或小區塊呈現，不是一整牆文字。
- [ ] Review controls 在手機為穩定雙欄或自然換行。
- [ ] 法規提醒明確、可執行，但不使用恐嚇式語氣。

## Pre-deploy UI Check

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:visual`
- [ ] 檢查 `test-results/visual` 的首頁與報告截圖。
- [ ] 依 `docs/responsive-qa-checklist.md` 補做人工 viewport 檢查。
- [ ] Production URL 再做一次 Copy、Export、表單送出與 429 smoke test。

## Developer Diagnostics Safety

- [ ] Developer Console is protected by server-side role checks, not client-only UI checks.
- [ ] UserMenu developer badge is display-only and does not authorize access.
- [ ] Developer diagnostics show key presence only as `true` / `false`.
- [ ] Developer diagnostics do not render raw API keys, service role keys, encryption keys, cookies, or tokens.
- [ ] Demo Developer Mode is clearly labeled when Supabase is not configured.
- [ ] `/dev`, `/dev/ai-diagnostics`, and `/dev/help-diagnostics` do not create horizontal overflow.

## Floating Widget / Help Center UI Safety Checklist

- [ ] Floating button does not create layout shift when it mounts.
- [ ] Floating button does not create horizontal overflow on 390, 768, or 1440 width viewports.
- [ ] Mobile layouts keep bottom safe-area spacing with `env(safe-area-inset-bottom)`.
- [ ] Floating button does not cover product form submit buttons.
- [ ] Floating button does not cover primary landing-page or dashboard CTAs.
- [ ] Floating button does not cover auth submit buttons.
- [ ] Floating widget z-index stays below drawer, modal, and blocking overlay layers.
- [ ] Drawer open state has explicit body scroll behavior before release.
- [ ] Drawer mobile layout stays within the viewport width and height.
- [ ] Drawer desktop layout overlays from the side without resizing or crushing the page layout.
- [ ] Esc handling, focus management, focus trap, and aria-live behavior are implemented in the formal Help Center phase.
- [ ] New Help Center UI work is not merged until visual tests cover the floating button, drawer, primary CTA, auth form, and product form routes.
