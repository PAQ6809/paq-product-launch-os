import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { ProductDetail } from "@/components/product/ProductDetail";
import { getProductById, mockProducts } from "@/data/mock-products";
import type { AppLocale } from "@/i18n/routing";

export function generateStaticParams() { return mockProducts.map((product) => ({ id: product.id })); }

export default async function ProductPage({ params }: { params: Promise<{ locale: AppLocale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ContentContainer className="py-8 sm:py-10 lg:py-12"><ProductDetail product={getProductById(id)} requestedProductId={id} /></ContentContainer>;
}
