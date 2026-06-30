import { expect, test, type Page } from "@playwright/test";

const locales = ["zh-TW", "en", "ja", "ko", "ar"];
const authPaths = ["login", "signup", "reset-password"];

async function expectNoBrokenText(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toContain("??");
  expect(text).not.toContain("\uFFFD");
}

async function expectNoHorizontalOverflow(page: Page) {
  const layout = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    htmlScrollWidth: document.documentElement.scrollWidth
  }));

  expect(layout.htmlScrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

function boxesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number }
) {
  return first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
}

test("root login redirects to localized login without broken text", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/(zh-TW|en|ja|ko|ar)\/login$/);
  await expect(page.locator("main h1")).toBeVisible();
  await expectNoBrokenText(page);
  await expectNoHorizontalOverflow(page);
});

test("zh-TW auth copy is readable", async ({ page }) => {
  await page.goto("/zh-TW/login");
  await expect(page.getByText("Supabase Auth")).toBeVisible();
  await expect(page.getByRole("heading", { name: "登入 PAQ 帳號" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("密碼")).toBeVisible();
  await expect(page.getByRole("button", { name: /登入/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /寄送 Magic Link/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "還沒有帳號？註冊" })).toBeVisible();
  await expect(page.getByRole("link", { name: "忘記密碼？" })).toBeVisible();

  await page.goto("/zh-TW/signup");
  await expect(page.getByRole("heading", { name: "建立 PAQ 帳號" })).toBeVisible();
  await expect(page.getByRole("button", { name: /建立帳號/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "已經有帳號？登入" })).toBeVisible();

  await page.goto("/zh-TW/reset-password");
  await expect(page.getByRole("heading", { name: "重設密碼" })).toBeVisible();
  await expect(page.getByRole("button", { name: /寄送重設連結/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "返回登入" })).toBeVisible();
});

test("all locale auth pages avoid question mark fallbacks and horizontal overflow", async ({ page }) => {
  test.slow();

  for (const locale of locales) {
    for (const path of authPaths) {
      await page.goto(`/${locale}/${path}`);
      await expect(page.locator("main")).toBeVisible();
      await expectNoBrokenText(page);
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("AI Help button does not cover auth card", async ({ page }) => {
  await page.goto("/zh-TW/login");
  const card = page.locator("main .surface").first();
  const helpButton = page.getByRole("button", { name: /AI Help/ });
  await expect(card).toBeVisible();
  await expect(helpButton).toBeVisible();

  const cardBox = await card.boundingBox();
  const helpBox = await helpButton.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(helpBox).not.toBeNull();

  if (cardBox && helpBox) {
    expect(boxesOverlap(cardBox, helpBox)).toBe(false);
  }
});
