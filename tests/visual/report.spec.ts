import { expect, test } from "@playwright/test";

test("Demo 報告在各 viewport 保持可讀且控制列可操作", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/zh-TW/products/arc-snap-power-bank/report");

  await expect(page.getByRole("heading", { name: /ArcSnap MagSafe 薄型行動電源 商品上市企劃報告/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Markdown" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" }).first()).toBeVisible();
  await expect(page.locator("img:not([alt])")).toHaveCount(0);

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);

  await page.screenshot({
    path: testInfo.outputPath("report-full.png"),
    fullPage: true,
    animations: "disabled"
  });
});
