# Responsive QA Checklist

## 測試 Viewport

| Viewport | 裝置定位 | 首頁 | Dashboard | 商品輸入 | 商品詳情 | 報告頁 |
| ---: | --- | --- | --- | --- | --- | --- |
| 320px | 小型手機 | [ ] | [ ] | [ ] | [ ] | [ ] |
| 375px | 一般手機 | [ ] | [ ] | [ ] | [ ] | [ ] |
| 390px | 現代手機 | [ ] | [ ] | [ ] | [ ] | [ ] |
| 430px | 大手機 | [ ] | [ ] | [ ] | [ ] | [ ] |
| 768px | 平板直向 | [ ] | [ ] | [ ] | [ ] | [ ] |
| 1024px | 平板橫向 / 小筆電 | [ ] | [ ] | [ ] | [ ] | [ ] |
| 1280px | 桌機 | [ ] | [ ] | [ ] | [ ] | [ ] |
| 1440px | 大桌機 | [ ] | [ ] | [ ] | [ ] | [ ] |

## 每個 Viewport 必查

對下列 routes 逐一執行完整檢查：

- `/`
- `/dashboard`
- `/products/new`
- `/products/arc-snap-power-bank`
- `/products/arc-snap-power-bank/report`

每個 route 都確認：

- [ ] CTA、連結、Copy、Export 可看見且可點擊。
- [ ] Card 不超出 viewport，等高 grid 不造成內容裁切。
- [ ] 商品名、URL、長英文與報告文案沒有溢出。
- [ ] Button 可換行，不互相重疊，觸控高度至少 44px。
- [ ] 圖片容器在載入前後高度固定，沒有明顯 layout shift。
- [ ] Header 可使用；手機 nav 只在自身容器水平滑動。
- [ ] Lifecycle 只在元件內水平滑動，不造成整頁爆版。
- [ ] Form label、input、textarea 與 select 對齊且可聚焦。
- [ ] Report summary、section、FAQ、社群與影片腳本可掃讀。
- [ ] 瀏覽器 console 沒有 hydration、image 或 accessibility error。

## Playwright 快速覆蓋

`npm run test:visual` 自動覆蓋 390x844、768x1024 與 1440x900。320、375、430、1024、1280 仍應在 release 前用 DevTools 或實機人工確認。
