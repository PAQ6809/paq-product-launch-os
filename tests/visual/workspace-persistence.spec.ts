import { expect, test } from "@playwright/test";

const cloudDraft = {
  draftKey: "draft-cloud-visual-smoke",
  formData: {
    name: "雲端恢復商品",
    category: "文創小物",
    features: "從 Supabase workspace 回復的草稿",
    cost: "120",
    expectedPrice: "480",
    targetAudience: "小品牌與電商賣家",
    brandStyle: "乾淨、可信任、有質感",
    salesChannels: "Pinkoi, Shopify"
  },
  currentStep: "product-input",
  completionPercent: 100,
  autosavedAt: "2026-07-02T08:00:00.000Z"
};

test("anonymous workspace API routes require auth without leaking data", async ({ request }) => {
  const cases = [
    { method: "GET" as const, route: "/api/products" },
    { method: "POST" as const, route: "/api/products", data: {} },
    { method: "GET" as const, route: "/api/drafts" },
    { method: "POST" as const, route: "/api/drafts", data: {} },
    { method: "GET" as const, route: "/api/reports?productId=demo-product" },
    { method: "POST" as const, route: "/api/reports", data: {} }
  ];

  for (const item of cases) {
    const response =
      item.method === "GET"
        ? await request.get(item.route)
        : await request.post(item.route, { data: item.data });

    expect(response.status(), `${item.method} ${item.route} should require auth`).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");

    const body = await response.text();
    expect(body).toContain("AUTH_REQUIRED");
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|NVIDIA_API_KEY|nvapi-|sk-[A-Za-z0-9_-]+/);
  }
});

test("product form can restore the latest cloud draft", async ({ page }) => {
  await page.route("**/api/drafts", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ draft: cloudDraft, source: "supabase" })
    });
  });

  await page.goto("/zh-TW/products/new");
  await expect(page.getByText(/雲端 workspace/)).toBeVisible();

  await page.getByRole("button", { name: "繼續編輯" }).click();
  await expect(page.locator("#product-name")).toHaveValue(cloudDraft.formData.name);
  await expect(page.locator("#product-features")).toHaveValue(cloudDraft.formData.features);
});
