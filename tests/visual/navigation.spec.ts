import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/zh-TW",
  "/zh-TW/login",
  "/zh-TW/signup",
  "/zh-TW/reset-password",
  "/en/login",
  "/ja/login",
  "/ko/login",
  "/ar/login"
];

async function expectNoHorizontalOverflow(page: Page, route: string) {
  const layout = await page.evaluate(() => {
    const header = document.querySelector("header");
    const languageSelect = document.querySelector("select");
    const viewportWidth = document.documentElement.clientWidth;
    const languageBox = languageSelect?.getBoundingClientRect();

    return {
      bodyScrollWidth: document.body.scrollWidth,
      clientWidth: viewportWidth,
      headerScrollWidth: header?.scrollWidth ?? 0,
      headerClientWidth: header?.clientWidth ?? 0,
      htmlScrollWidth: document.documentElement.scrollWidth,
      languageLeft: languageBox?.left ?? 0,
      languageRight: languageBox?.right ?? 0
    };
  });

  expect(layout.htmlScrollWidth, `${route} html should not overflow`).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.bodyScrollWidth, `${route} body should not overflow`).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.headerScrollWidth, `${route} header should not scroll horizontally`).toBeLessThanOrEqual(layout.headerClientWidth + 1);
  expect(layout.languageLeft, `${route} language switcher should stay inside viewport`).toBeGreaterThanOrEqual(-1);
  expect(layout.languageRight, `${route} language switcher should stay inside viewport`).toBeLessThanOrEqual(layout.clientWidth + 1);
}

test("header and language switcher stay within viewport", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
    await expectNoHorizontalOverflow(page, route);
  }
});
