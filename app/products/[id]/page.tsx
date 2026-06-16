import { ProductDetail } from "@/components/product/ProductDetail";
import { getProductById, mockProducts } from "@/data/mock-products";

export function generateStaticParams() {
  return mockProducts.map((product) => ({ id: product.id }));
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductById(id);

  return (
    <main className="page-shell py-8 sm:py-10">
      <ProductDetail product={product} requestedProductId={id} />
    </main>
  );
}
