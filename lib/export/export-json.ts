import type { LaunchReport } from "@/types/report";

export function exportLaunchReportJson(report: LaunchReport) {
  return JSON.stringify(
    {
      exportType: "paq-launch-report-json",
      exportedAt: new Date().toISOString(),
      legalReminder:
        "此 JSON 為 PAQ Product Launch OS 產生的可攜式模板，不代表已完成法規、商標、版權或平台規則審查。正式上架前需人工確認。",
      report
    },
    null,
    2
  );
}
