import { ProductReport } from "@/components/report/ProductReport";
import { getProductById, mockProducts } from "@/data/mock-products";

export function generateStaticParams() {
  return mockProducts.map((product) => ({ id: product.id }));
}

type ReportPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const product = getProductById(id);

  return (
    <main className="page-shell py-8 sm:py-10">
      <ProductReport product={product} requestedProductId={id} />
    </main>
  );
}
