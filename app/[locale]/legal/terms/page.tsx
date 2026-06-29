import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import type { AppLocale } from "@/i18n/routing";

export default async function TermsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <article className="surface prose max-w-none p-5 sm:p-6">
        <p className="text-sm font-semibold text-amber-700">Draft · Not legal advice</p>
        <h1>Terms of Service Draft</h1>
        <p>PAQ provides AI-assisted product launch planning, translation, review, and export tools. Users remain responsible for verifying claims, platform rules, copyright, trademarks, and legal compliance.</p>
        <p>PAQ does not guarantee sales results, platform approval, medical effects, or regulatory compliance.</p>
      </article>
    </ContentContainer>
  );
}
