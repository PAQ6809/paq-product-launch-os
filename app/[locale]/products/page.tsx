import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { ProductsHistory } from "@/components/product/ProductsHistory";
import type { AppLocale } from "@/i18n/routing";

export default async function ProductsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <ProductsHistory />
    </ContentContainer>
  );
}
