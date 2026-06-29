import { BarChart3, FileText, Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui/Card";

export function FeatureGrid() {
  const t = useTranslations("home");
  const features = [BarChart3, FileText, Megaphone].map((icon, index) => ({ icon, title: t(`feature${index + 1}Title`), text: t(`feature${index + 1}Text`) }));
  return (
    <section className="section-spacing bg-white">
      <ContentContainer>
      <SectionHeader className="mb-8" eyebrow={t("core")} title={t("coreTitle")} />
      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card
              key={feature.title}
              className="h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-panel"
            >
              <Icon className="mb-5 h-6 w-6 text-teal-600" aria-hidden="true" />
              <h3 className="break-words text-base font-semibold text-ink">{feature.title}</h3>
              <p className="mt-3 break-words text-sm leading-6 text-graphite/75">{feature.text}</p>
            </Card>
          );
        })}
      </div>
      </ContentContainer>
    </section>
  );
}
