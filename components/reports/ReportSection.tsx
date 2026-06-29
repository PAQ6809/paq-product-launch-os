import type { ReportTemplateSection } from "@/lib/report-builder/types";

export function ReportSection({ section }: { section: ReportTemplateSection }) {
  return (
    <section className="rounded-md border border-line bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-graphite/78">
        {section.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
