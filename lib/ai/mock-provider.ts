import { generateMockLaunchReport } from "@/lib/ai/mock-generate-launch-report";
import { assertValidLaunchReport } from "@/lib/ai/validators/launch-report-validator";
import type { AIProvider, GenerateLaunchReportInput } from "@/lib/ai/provider";

export class MockAIProvider implements AIProvider {
  readonly name = "mock" as const;

  async generateLaunchReport(input: GenerateLaunchReportInput) {
    return assertValidLaunchReport(generateMockLaunchReport(input));
  }
}
