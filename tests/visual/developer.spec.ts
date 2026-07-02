import { expect, test, type Page } from "@playwright/test";

const forbiddenSecretText = /OPENAI_API_KEY|NVIDIA_API_KEY|SUPABASE_SERVICE_ROLE_KEY|ENCRYPTION_MASTER_KEY|nvapi-|sk-[A-Za-z0-9]/;
const diagnosticsMetadataText = /AI_PROVIDER|HELP_AI_PROVIDER|OpenAI key configured|NVIDIA key configured|Public real AI|Public Help AI|Secret redaction|Rate limit status|Developer docs|i18n status/;

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

async function expectNoDiagnosticsMetadata(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(diagnosticsMetadataText);
}

async function isLoginRedirect(page: Page) {
  const url = new URL(page.url());
  return /\/(zh-TW|en|ja|ko|ar)\/login$/.test(url.pathname) && url.searchParams.has("redirectTo");
}

async function expectSafeLoginRedirect(page: Page, expectedTarget: RegExp) {
  const url = new URL(page.url());
  expect(url.searchParams.get("redirectTo") ?? "").toMatch(expectedTarget);
  await expect(page.getByText("Supabase Auth")).toBeVisible();
  await expect(page.locator("main h1")).toBeVisible();
  await expectNoDiagnosticsMetadata(page);
  await expectNoSecretLeak(page);
  await expectNoHorizontalOverflow(page);
}

test("developer console redirects through locale and shows safe development demo diagnostics", async ({ page }) => {
  await page.goto("/dev");

  if (await isLoginRedirect(page)) {
    await expectSafeLoginRedirect(page, /\/(?:(zh-TW|en|ja|ko|ar)\/)?dev$/);
    return;
  }

  await expect(page).toHaveURL(/\/(zh-TW|en|ja|ko|ar)\/dev$/);
  await expect(page.getByRole("heading", { name: "Developer Console" })).toBeVisible();
  await expect(page.getByText("Demo Developer Mode").first()).toBeVisible();
  await expect(page.getByText("OpenAI key configured")).toBeVisible();
  await expect(page.getByText("NVIDIA key configured")).toBeVisible();
  await expect(page.getByRole("button", { name: /AI Help/ })).toHaveCount(0);
  await expectNoSecretLeak(page);
  await expectNoHorizontalOverflow(page);
});

test("developer diagnostics routes do not expose secrets", async ({ page }) => {
  for (const route of ["/zh-TW/dev", "/zh-TW/dev/ai-diagnostics", "/zh-TW/dev/help-diagnostics"]) {
    await page.goto(route);

    if (await isLoginRedirect(page)) {
      await expectSafeLoginRedirect(page, /\/(?:(zh-TW|en|ja|ko|ar)\/)?dev(?:\/.*)?$/);
      continue;
    }

    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByRole("button", { name: /AI Help/ })).toHaveCount(0);
    await expectNoSecretLeak(page);
    await expectNoHorizontalOverflow(page);
  }
});

test("public header does not show developer console link without server role", async ({ page }) => {
  await page.goto("/zh-TW");
  await expect(page.getByRole("link", { name: "Developer Console" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
