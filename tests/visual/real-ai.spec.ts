import { expect, test } from "@playwright/test";
import { generateMockLaunchReport } from "../../lib/ai/mock-generate-launch-report";
import { validateLaunchReportPayload } from "../../lib/ai/validators/launch-report-validator";

const input = {
  productName: "Real AI Smoke Test",
  category: "3C 配件",
  features: "輕薄磁吸、可放入口袋、適合通勤補電",
  cost: 420,
  targetPrice: 1280,
  targetAudience: "需要輕量充電配件的通勤族",
  brandStyle: "俐落、可信、科技感",
  salesChannels: ["Shopify", "IG"],
  imageUrl: "/hero-workspace.png"
};

test("generate report API returns safe analysis metadata without secrets", async ({ request }, testInfo) => {
  const response = await request.post("/api/generate-report", {
    headers: { "x-forwarded-for": `203.0.113.${40 + testInfo.workerIndex}` },
    data: input
  });
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.report.analysis.executiveSummary.summary).toContain(input.productName);
  expect(body.report.metadata.isAiGenerated).toBe(true);
  expect(body.validationPassed).toBe(true);
  expect(body.loginRequired).toEqual(expect.any(Boolean));
  expect(body.realAIEligible).toEqual(expect.any(Boolean));

  const serialized = JSON.stringify(body);
  expect(serialized).not.toMatch(/OPENAI_API_KEY|NVIDIA_API_KEY|SUPABASE_SERVICE_ROLE_KEY|ENCRYPTION_MASTER_KEY|nvapi-|sk-[A-Za-z0-9_-]+/);
});

test("launch report validator blocks risky outward claims but allows risk notes", () => {
  const safeReport = generateMockLaunchReport(input);
  const safeValidation = validateLaunchReportPayload(safeReport, { requireAnalysis: true });
  expect(safeValidation.ok).toBe(true);

  const riskyReport = structuredClone(safeReport);
  riskyReport.productTitle = "保證最有效 100% 無風險商品";
  const riskyValidation = validateLaunchReportPayload(riskyReport, { requireAnalysis: true });
  expect(riskyValidation.ok).toBe(false);
  expect(riskyValidation.errors.join(" ")).toContain("Forbidden outward-facing marketing claim");

  const legalRiskReport = generateMockLaunchReport(input);
  legalRiskReport.legalRiskNotes.push("風險提醒：不得使用保證、療效、治療或 100% 有效等宣稱。");
  legalRiskReport.analysis?.legalRiskAssessment.riskyClaims.push("保證、療效、治療");
  const legalRiskValidation = validateLaunchReportPayload(legalRiskReport, { requireAnalysis: true });
  expect(legalRiskValidation.ok).toBe(true);
});

test("report page renders AI metadata without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh-TW/products/arc-snap-power-bank/report");

  await expect(page.getByText("Provider").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
