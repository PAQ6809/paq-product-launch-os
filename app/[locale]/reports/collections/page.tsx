import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { CollectionBuilder } from "@/components/reports/CollectionBuilder";
import type { AppLocale } from "@/i18n/routing";

export default async function ReportCollectionsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <div className="grid gap-8">
        <PageHeader
          title="Report Collections"
          description="Create professional multi-product reports for portfolio overviews, launch plans, investor briefs, and cross-border catalogs."
        />
        <CollectionBuilder />
      </div>
    </ContentContainer>
  );
}
