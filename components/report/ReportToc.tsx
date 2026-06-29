import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReportSection } from "@/types";

export function ReportToc({ sections }: { sections: ReportSection[] }) {
  const t = useTranslations("report");
  return (
    <aside className="surface sticky top-24 hidden min-w-0 max-h-[calc(100vh-7rem)] overflow-auto p-4 lg:block">
      <p className="mb-3 text-sm font-semibold text-ink">{t("toc")}</p>
      <nav className="grid gap-1">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`#${section.id}`}
            className="break-words rounded-md px-3 py-2 text-sm leading-5 text-graphite/75 transition hover:bg-mist hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            {section.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
