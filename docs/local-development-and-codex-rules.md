# 本機開發與 Codex 工作規則

## 本機開發指令

如果是在 Windows 自己開資料夾：

```powershell
mkdir paq-product-launch-os
cd paq-product-launch-os
```

如果 Codex 要建立 Next.js 專案：

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app
npm run dev
```

如果要初始化 git：

```bash
git init
git add .
git commit -m "Initial PAQ Product Launch OS MVP"
```

## Codex 工作規則

1. 不要一次做超出本階段範圍的功能。
2. 不要刪除現有功能。
3. 不要重寫整個專案，除非使用者明確要求。
4. 修改前先說明計畫。
5. 修改後列出改了哪些檔案。
6. 若有不確定的技術選擇，先採用最簡單、最穩定、最容易部署的方案。
7. 所有程式碼要可維護、模組化、型別清楚。
8. 不要把 API key、token、密碼寫進程式碼。
9. 不要直接複製外部 repo 程式碼，除非 license 允許且有註明來源。
10. 每次完成後都要執行 lint/build，若失敗請修正。
11. 若功能還是假資料，請明確標註 mock/demo，不要假裝已經串上正式服務。
12. 對食品、美妝、保健、醫療商品，不要產生療效宣稱。
13. 包裝設計與 AI 圖片素材要加入人工審核提醒。

## 推薦實作順序

1. 開 GitHub repo：`paq-product-launch-os`
2. 第 0 階段：建立產品文件
3. 第 1 階段：研究 10 個 GitHub repo
4. 第 2、3 階段：產出架構與資料庫 schema
5. 第 4 階段：建立 MVP UI
6. 第 5 階段：建立 mock AI report
7. 第 7、8 階段：加入人工審核與匯出
8. 最後再接真 AI API

## 第一版定位

第一版不要做成「自動幫人做完整品牌公司」。

第一版目標：

> 上傳商品資料，AI 產出完整商品上市企劃書。

這個範圍最穩、最容易 demo，也最容易拿去詢問店家是否願意付費。先做得出來，再談做大。
