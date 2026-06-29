import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";

export function HeroDemo() {
  const t = useTranslations("home");
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <Image
        src="/hero-workspace.png"
        alt="商品企劃工作桌與上市報告預覽"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-48"
      />
      <div className="absolute inset-0 bg-ink/80" />

      <ContentContainer className="relative grid min-h-[34rem] items-center py-12 sm:min-h-[38rem] sm:py-16 lg:min-h-[42rem]">
        <div className="min-w-0 max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-white/75">
              {t("eyebrow")}
            </p>
            <Badge tone="teal" className="border-white/10 bg-white/10 text-white">
              {t("demoBadge")}
            </Badge>
          </div>

          <h1 className="max-w-4xl break-words text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-3xl break-words text-base leading-7 text-white/85 sm:mt-6 sm:text-lg sm:leading-8">
            {t("subtitle")}
          </p>
          <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-white/75 sm:text-base">
            {t("audience")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/products/new"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-2 text-center text-base font-semibold text-ink transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              {t("start")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="#demo-products"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-2 text-center text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              {t("viewDemo")}
            </Link>
          </div>
        </div>
      </ContentContainer>
    </section>
  );
}
