import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SecurityCenter } from "@/components/security/SecurityCenter";
import type { AppLocale } from "@/i18n/routing";

export default async function SecuritySettingsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <SecurityCenter />
    </ContentContainer>
  );
}
