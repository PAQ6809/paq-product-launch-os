import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { ProductForm } from "@/components/product/ProductForm";
import type { AppLocale } from "@/i18n/routing";

export default async function NewProductPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentContainer className="py-8 sm:py-10 lg:py-12"><ProductForm /></ContentContainer>;
}
