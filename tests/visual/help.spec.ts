import { expect, test, type Page } from "@playwright/test";

const forbiddenSecretText = /OPENAI_API_KEY|NVIDIA_API_KEY|SUPABASE_SERVICE_ROLE_KEY|ENCRYPTION_MASTER_KEY|nvapi-|sk-[A-Za-z0-9]/;
const diagnosticsMetadataText = /AI_PROVIDER|HELP_AI_PROVIDER|OpenAI key configured|NVIDIA key configured|Public real AI|Public Help AI|Secret redaction|Rate limit status|Developer docs|i18n status/;

async function isLoginRedirect(page: Page) {
  const url = new URL(page.url());
  return /\/(zh-TW|en|ja|ko|ar)\/login$/.test(url.pathname) && url.searchParams.has("redirectTo");
}

async function expectNoSecretLeak(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(forbiddenSecretText);
}

async function expectNoDiagnosticsMetadata(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(diagnosticsMetadataText);
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

test("AI Help button appears on homepage", async ({ page }) => {
  await page.goto("/zh-TW");
  await expect(page.getByRole("button", { name: /AI Help/ })).toBeVisible();
});

test("AI Help drawer opens, closes, and handles Escape", async ({ page }) => {
  await page.goto("/zh-TW");
  await page.getByRole("button", { name: /AI Help/ }).click();
  await expect(page.getByRole("dialog", { name: "PAQ AI Help" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "PAQ AI Help" })).toHaveCount(0);

  await page.getByRole("button", { name: /AI Help/ }).click();
  await page.getByRole("dialog", { name: "PAQ AI Help" }).getByRole("button", { name: "關閉" }).click();
  await expect(page.getByRole("dialog", { name: "PAQ AI Help" })).toHaveCount(0);
});

test("quick prompt sends and related links display", async ({ page }) => {
  await page.goto("/zh-TW");
  await page.getByRole("button", { name: /AI Help/ }).click();
  await page.getByRole("button", { name: "如何建立產品？" }).click();

  const dialog = page.getByRole("dialog", { name: "PAQ AI Help" });
  await expect(dialog.getByText("相關頁面").first()).toBeVisible();
  await expect(dialog.getByRole("link", { name: /建立商品企劃|產品列表/ }).first()).toBeVisible();
});

test("out-of-scope help question refuses without provider data", async ({ request }, testInfo) => {
  const response = await request.post("/api/help-chat", {
    headers: { "x-forwarded-for": `198.51.100.${testInfo.workerIndex + 10}` },
    data: {
      message: "幫我推薦股票",
      history: [],
      locale: "zh-TW",
      currentPath: "/zh-TW"
    }
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.scope).toBe("out_of_scope");
  expect(body.provider).toBe("mock");
  expect(JSON.stringify(body)).not.toContain("nvapi-");
});

test("homework writing is out of scope", async ({ request }, testInfo) => {
  const response = await request.post("/api/help-chat", {
    headers: { "x-forwarded-for": `198.51.100.${testInfo.workerIndex + 20}` },
    data: {
      message: "幫我寫一份作業",
      history: [],
      locale: "zh-TW",
      currentPath: "/zh-TW"
    }
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.scope).toBe("out_of_scope");
  expect(body.provider).toBe("mock");
});

test("default Help provider uses mock and does not return API keys", async ({ request }, testInfo) => {
  const response = await request.post("/api/help-chat", {
    headers: { "x-forwarded-for": `198.51.100.${testInfo.workerIndex + 40}` },
    data: {
      message: "報告可以匯出哪些格式？",
      history: [],
      locale: "zh-TW",
      currentPath: "/zh-TW/products/arc-snap-power-bank/report"
    }
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.provider).toBe("mock");
  expect(body.relatedLinks.length).toBeGreaterThan(0);
  expect(JSON.stringify(body)).not.toMatch(/nvapi-|NVIDIA_API_KEY|OPENAI_API_KEY/);
});

test("anonymous account help uses minimal login guidance", async ({ request }, testInfo) => {
  const response = await request.post("/api/help-chat", {
    headers: { "x-forwarded-for": `198.51.100.${testInfo.workerIndex + 50}` },
    data: {
      message: "我的歷史產品在哪裡？",
      history: [],
      locale: "zh-TW",
      currentPath: "/zh-TW/dashboard"
    }
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.scope).toBe("account_help");
  expect(body.answer).toContain("匿名模式");
  expect(JSON.stringify(body)).not.toMatch(/productName|features|longDescription|NVIDIA_API_KEY|OPENAI_API_KEY/);
});

test("security help questions return security scope without leaking secrets", async ({ request }, testInfo) => {
  const response = await request.post("/api/help-chat", {
    headers: { "x-forwarded-for": `198.51.100.${testInfo.workerIndex + 60}` },
    data: {
      message: "我的資料安全嗎？",
      history: [],
      locale: "zh-TW",
      currentPath: "/zh-TW/settings/security"
    }
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.scope).toBe("security_help");
  expect(body.provider).toBe("mock");
  expect(body.answer).toContain("不構成法律意見");
  expect(JSON.stringify(body)).not.toMatch(/nvapi-|NVIDIA_API_KEY|OPENAI_API_KEY/);
});

test("Help rate limit returns 429", async ({ request }, testInfo) => {
  const ip = `203.0.113.${testInfo.workerIndex + 80}`;
  let lastStatus = 0;

  for (let index = 0; index < 21; index += 1) {
    const response = await request.post("/api/help-chat", {
      headers: { "x-forwarded-for": ip },
      data: {
        message: "如何建立產品？",
        history: [],
        locale: "zh-TW",
        currentPath: "/zh-TW/products/new"
      }
    });
    lastStatus = response.status();
  }

  expect(lastStatus).toBe(429);
});

test("mobile drawer has no horizontal overflow", async ({ page }) => {
  await page.goto("/zh-TW");
  await page.getByRole("button", { name: /AI Help/ }).click();
  await expect(page.getByRole("dialog", { name: "PAQ AI Help" })).toBeVisible();

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
});

test("developer diagnostics routes do not render the public Help widget", async ({ page }) => {
  for (const route of ["/zh-TW/dev", "/zh-TW/dev/ai-diagnostics", "/zh-TW/dev/help-diagnostics"]) {
    await page.goto(route);

    if (await isLoginRedirect(page)) {
      await expect(page.getByText("Supabase Auth")).toBeVisible();
      await expectNoDiagnosticsMetadata(page);
      await expectNoSecretLeak(page);
      await expectNoHorizontalOverflow(page);
      continue;
    }

    await expect(page.getByRole("button", { name: /AI Help/ })).toHaveCount(0);
    await expectNoSecretLeak(page);
    await expectNoHorizontalOverflow(page);
  }
});
