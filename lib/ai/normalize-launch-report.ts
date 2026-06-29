import type { GenerateLaunchReportInput } from "@/lib/ai/provider";
import type { LaunchReport } from "@/types/report";

const REGULATED_CATEGORY_PATTERN = /食品|飲品|保健|醫療|美妝|保養|香氛|精油|身體|肌膚/iu;

const regulatedReminder =
  "此商品可能涉及食品、美妝、保健、醫療、香氛或身體接觸相關規範；正式對外使用前需由真人確認標示、成分、廣告語、平台分類與當地法規。";

type NormalizeGeneratedReportOptions = {
  isMock: boolean;
};

export function normalizeGeneratedLaunchReport(
  report: LaunchReport,
  input: GenerateLaunchReportInput,
  options: NormalizeGeneratedReportOptions
): LaunchReport {
  const normalized: LaunchReport = {
    ...report,
    productName: input.productName,
    category: input.category,
    generatedAt: new Date().toISOString(),
    isMock: options.isMock,
    pricingStrategy: {
      ...report.pricingStrategy,
      suggestedPrice: Number(report.pricingStrategy.suggestedPrice) || input.targetPrice
    },
    legalRiskNotes: [...report.legalRiskNotes]
  };

  const regulatedSource = `${input.category} ${input.features} ${input.productName}`;

  if (!REGULATED_CATEGORY_PATTERN.test(regulatedSource)) {
    return normalized;
  }

  return {
    ...normalized,
    packagingBrief: {
      ...normalized.packagingBrief,
      complianceNotes: Array.from(
        new Set([...normalized.packagingBrief.complianceNotes, regulatedReminder])
      )
    },
    legalRiskNotes: Array.from(new Set([...normalized.legalRiskNotes, regulatedReminder]))
  };
}
