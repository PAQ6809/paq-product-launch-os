import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";

export function OutputPreview() {
  const t = useTranslations("home");
  const outputs = Array.from({ length: 12 }, (_, index) => t(`output${index + 1}`));
  return (
    <section className="section-spacing border-y border-line bg-mist">
      <ContentContainer>
        <SectionHeader
          className="mb-8"
          eyebrow={t("outputs")}
          title={t("outputsTitle")}
          description={t("outputsText")}
        />

        <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {outputs.map((output) => (
            <div
              key={output}
              className="flex min-h-14 items-center gap-3 rounded-md border border-line bg-white px-4 py-3"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" aria-hidden="true" />
              <span className="min-w-0 break-words text-sm font-semibold text-ink">{output}</span>
            </div>
          ))}
        </div>
      </ContentContainer>
    </section>
  );
}
