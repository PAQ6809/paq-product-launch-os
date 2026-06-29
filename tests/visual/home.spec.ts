import { expect, test } from "@playwright/test";

test("首頁在各 viewport 保持可讀且沒有水平爆版", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/zh-TW");

  await expect(page.getByRole("heading", { name: "上傳商品資料，AI 產出完整商品上市企劃書" })).toBeVisible();
  await expect(page.getByRole("link", { name: "開始建立商品企劃" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "直接查看三個 Demo 商品的完整上市企劃" })).toBeVisible();
  await expect(page.locator("img:not([alt])")).toHaveCount(0);

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);

  await page.screenshot({
    path: testInfo.outputPath("home-full.png"),
    fullPage: true,
    animations: "disabled"
  });
});

test("Dashboard、商品輸入與商品詳情沒有整頁水平爆版", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const routes = ["/zh-TW/dashboard", "/zh-TW/products/new", "/zh-TW/products/arc-snap-power-bank"];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));

    expect(layout.scrollWidth, `${route} should not overflow horizontally`).toBeLessThanOrEqual(layout.clientWidth + 1);
  }

  await page.goto("/zh-TW/products/new");
  const unlabeledControls = await page.locator("input, textarea, select").evaluateAll((controls) =>
    controls.filter((control) => !(control as HTMLInputElement).labels?.length && !control.getAttribute("aria-label")).length
  );

  expect(unlabeledControls).toBe(0);
});

test("五個 locale 可開啟，Arabic 使用 RTL", async ({ page }) => {
  for (const locale of ["zh-TW", "en", "ja", "ko", "ar"]) {
    await page.goto(`/${locale}`);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  }
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ارفع بيانات المنتج");
});
