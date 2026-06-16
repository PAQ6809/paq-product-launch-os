import type { Product, ReportSection } from "@/types";
import { generateMockLaunchReport, launchReportToSections } from "@/lib/ai/mock-generate-launch-report";

export function generateMockReport(product: Product): ReportSection[] {
  const report = generateMockLaunchReport({
    productName: product.name,
    category: product.category,
    features: product.features,
    cost: product.cost,
    targetPrice: product.expectedPrice,
    targetAudience: product.targetAudience,
    brandStyle: product.brandStyle,
    salesChannels: product.salesPlatforms,
    imageUrl: product.imageUrl
  });

  return launchReportToSections(report);
}
