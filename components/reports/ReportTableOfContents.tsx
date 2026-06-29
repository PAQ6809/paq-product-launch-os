import type { ReportTemplateSection } from "@/lib/report-builder/types";

export function ReportTableOfContents({ sections }: { sections: ReportTemplateSection[] }) {
  return (
    <nav className="rounded-md border border-line bg-white p-4" aria-label="Report table of contents">
      <p className="text-sm font-semibold text-ink">Table of Contents</p>
      <ol className="mt-3 grid gap-2 text-sm text-graphite/75">
        {sections.map((section, index) => (
          <li key={section.id}>{index + 1}. {section.title}</li>
        ))}
      </ol>
    </nav>
  );
}
