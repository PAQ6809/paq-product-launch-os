import { ConfidentialityNotice } from "@/components/reports/ConfidentialityNotice";
import { ReportSection } from "@/components/reports/ReportSection";
import type { NormalizedProductAnalysisReport } from "@/lib/report-builder/types";

export function ReportTemplateShell({ report }: { report: NormalizedProductAnalysisReport }) {
  return (
    <article className="grid gap-4">
      <div className="rounded-md border border-line bg-white p-5">
        <p className="text-sm font-semibold text-teal-700">{report.templateId}</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{report.title}</h1>
        <p className="mt-2 text-sm text-graphite/70">Prepared for {report.preparedFor} · {report.generatedAt}</p>
      </div>
      <ConfidentialityNotice />
      {report.sections.map((section) => <ReportSection key={section.id} section={section} />)}
    </article>
  );
}
