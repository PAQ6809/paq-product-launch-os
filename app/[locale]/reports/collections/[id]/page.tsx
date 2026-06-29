import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { CollectionDetail } from "@/components/reports/CollectionDetail";
import type { AppLocale } from "@/i18n/routing";

export default async function CollectionPage({ params }: { params: Promise<{ locale: AppLocale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <CollectionDetail collectionId={id} />
    </ContentContainer>
  );
}
