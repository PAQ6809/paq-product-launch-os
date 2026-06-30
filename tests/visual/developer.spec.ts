import { expect, test, type Page } from "@playwright/test";

const forbiddenSecretText = /OPENAI_API_KEY|NVIDIA_API_KEY|SUPABASE_SERVICE_ROLE_KEY|ENCRYPTION_MASTER_KEY|nvapi-|sk-[A-Za-z0-9]/;

// Production guard note:
// The Playwright visual server runs in development, so it may show Demo Developer Mode.
// In production, lib/auth/roles.ts fails closed unless ENABLE_DEV_DIAGNOSTICS=true
// and the Supabase profile role is developer/admin. Missing Supabase env never enables demo diagnostics in production.

async function expectNoHorizontalOverflow(page: Page) {
  const layout = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    htmlScrollWidth: document.documentElement.scrollWidth
  }));

  expect(layout.htmlScrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

async function expectNoSecretLeak(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(forbiddenSecretText);
  expect(text).not.toContain("??");
  expect(text).not.toContain("\uFFFD");
}

test("developer console redirects through locale and shows safe development demo diagnostics", async ({ page }) => {
  await page.goto("/dev");
  await expect(page).toHaveURL(/\/(zh-TW|en|ja|ko|ar)\/dev$/);
  await expect(page.getByRole("heading", { name: "Developer Console" })).toBeVisible();
  await expect(page.getByText("Demo Developer Mode").first()).toBeVisible();
  await expect(page.getByText("OpenAI key configured")).toBeVisible();
  await expect(page.getByText("NVIDIA key configured")).toBeVisible();
  await expectNoSecretLeak(page);
  await expectNoHorizontalOverflow(page);
});

test("developer diagnostics routes do not expose secrets", async ({ page }) => {
  for (const route of ["/zh-TW/dev/ai-diagnostics", "/zh-TW/dev/help-diagnostics"]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await expectNoSecretLeak(page);
    await expectNoHorizontalOverflow(page);
  }
});

test("public header does not show developer console link without server role", async ({ page }) => {
  await page.goto("/zh-TW");
  await expect(page.getByRole("link", { name: "Developer Console" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
