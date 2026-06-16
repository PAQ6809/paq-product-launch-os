import Link from "next/link";
import type { ReportSection } from "@/types";

export function ReportToc({ sections }: { sections: ReportSection[] }) {
  return (
    <aside className="surface sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-auto p-4 lg:block">
      <p className="mb-3 text-sm font-semibold text-ink">報告目錄</p>
      <nav className="grid gap-1">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`#${section.id}`}
            className="rounded-md px-3 py-2 text-sm text-graphite/75 transition hover:bg-mist hover:text-ink"
          >
            {section.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
