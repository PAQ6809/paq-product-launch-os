import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import type { AppLocale } from "@/i18n/routing";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <article className="surface prose max-w-none p-5 sm:p-6">
        <p className="text-sm font-semibold text-amber-700">Draft · Not legal advice</p>
        <h1>Privacy Policy Draft</h1>
        <p>PAQ Product Launch OS processes account data, product metadata, product confidential data, AI reports, translations, export metadata, and audit events to provide the product launch workspace.</p>
        <p>Production use should configure Supabase Auth, RLS, server-side session checks, optional application-level encryption, and clear retention/deletion procedures.</p>
      </article>
    </ContentContainer>
  );
}
