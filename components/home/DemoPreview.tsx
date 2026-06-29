import { ContentContainer } from "@/components/layout/ContentContainer";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { sampleProducts } from "@/data/sample-products";

export function DemoPreview() {
  const t = useTranslations("home");
  return (
    <section id="demo-products" className="section-spacing bg-white">
      <ContentContainer>
        <SectionHeader
          className="mb-8"
          eyebrow={t("demo")}
          title={t("demoTitle")}
          description={t("demoText")}
        />

        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sampleProducts.map((product) => (
            <ProductCard key={product.id} product={product} actionLabel={t("viewFull")} />
          ))}
        </div>
      </ContentContainer>
    </section>
  );
}
