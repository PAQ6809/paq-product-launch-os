import { expect, test } from "@playwright/test";

const mainRoutes = [
  "/zh-TW",
  "/zh-TW/dashboard",
  "/zh-TW/products",
  "/zh-TW/products/new",
  "/zh-TW/products/arc-snap-power-bank",
  "/zh-TW/products/arc-snap-power-bank/report",
  "/zh-TW/reports/collections",
  "/zh-TW/settings/security",
  "/zh-TW/legal/privacy",
  "/zh-TW/legal/terms"
];

test("main website routes and navigation links stay connected", async ({ page, request }) => {
  for (const route of mainRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} should not be missing`).toBeLessThan(400);
  }

  await page.goto("/zh-TW");
  const sameOriginHrefs = await page.locator("a[href^='/']").evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).getAttribute("href") ?? "")
  );

  expect(sameOriginHrefs.some((href) => href.includes("/zh-TW/zh-TW"))).toBeFalsy();
  expect(sameOriginHrefs).toContain("/zh-TW/products/new");
  expect(sameOriginHrefs).toContain("/zh-TW/products/arc-snap-power-bank/report");
});

test("Help related links navigate without duplicate locale prefixes", async ({ page }) => {
  await page.goto("/zh-TW");
  await page.getByRole("button", { name: /AI Help/ }).click();
  await page.getByRole("button", { name: "如何建立產品？" }).click();

  const createLink = page
    .getByRole("dialog", { name: "PAQ AI Help" })
    .locator('a[href="/zh-TW/products/new"]')
    .first();
  await expect(createLink).toBeVisible();
  await createLink.click();

  await expect(page).toHaveURL(/\/zh-TW\/products\/new$/);
  await expect(page).not.toHaveURL(/\/zh-TW\/zh-TW\//);
});

test("AI website channels return safe mock metadata in visual smoke mode", async ({ request }, testInfo) => {
  const ipBase = 120 + testInfo.workerIndex;
  const input = {
    productName: "Smoke Test 商品",
    category: "文創小物",
    features: "可攜帶、適合送禮、具有明確設計風格",
    cost: 120,
    targetPrice: 480,
    targetAudience: "小品牌與電商賣家",
    brandStyle: "乾淨、現代、可展示",
    salesChannels: ["Shopify", "Pinkoi"],
    imageUrl: "/hero-workspace.png"
  };

  const reportResponse = await request.post("/api/generate-report", {
    headers: { "x-forwarded-for": `198.51.100.${ipBase}` },
    data: input
  });
  expect(reportResponse.ok()).toBeTruthy();
  const reportBody = await reportResponse.json();
  expect(reportBody.provider).toBe("mock");
  expect(reportBody.report.productName).toBe(input.productName);
  expect(reportBody.validationPassed).toBe(true);

  const translationResponse = await request.post("/api/translate-report", {
    headers: { "x-forwarded-for": `198.51.100.${ipBase + 20}` },
    data: {
      report: reportBody.report,
      sourceLocale: "zh-TW",
      targetLocale: "en",
      providerPreference: "mock"
    }
  });
  expect(translationResponse.ok()).toBeTruthy();
  const translationBody = await translationResponse.json();
  expect(translationBody.provider).toBe("mock");
  expect(translationBody.validationPassed).toBe(true);

  const helpResponse = await request.post("/api/help-chat", {
    headers: { "x-forwarded-for": `198.51.100.${ipBase + 40}` },
    data: {
      message: "報告可以匯出哪些格式？",
      history: [],
      locale: "zh-TW",
      currentPath: "/zh-TW/products/arc-snap-power-bank/report"
    }
  });
  expect(helpResponse.ok()).toBeTruthy();
  const helpBody = await helpResponse.json();
  expect(helpBody.provider).toBe("mock");
  expect(helpBody.scope).not.toBe("out_of_scope");

  const combined = JSON.stringify({ reportBody, translationBody, helpBody });
  expect(combined).not.toMatch(/nvapi-|NVIDIA_API_KEY|OPENAI_API_KEY|sk-[A-Za-z0-9_-]+/);
});
