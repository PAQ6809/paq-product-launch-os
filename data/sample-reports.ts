import { sampleProductInputs } from "@/data/sample-products";
import { generateMockLaunchReport } from "@/lib/ai/mock-generate-launch-report";

export const sampleReports = sampleProductInputs.map((product) => ({
  productId: product.id,
  report: generateMockLaunchReport(product)
}));

export function getSampleReportByProductId(id: string) {
  return sampleReports.find((item) => item.productId === id)?.report ?? sampleReports[0].report;
}
