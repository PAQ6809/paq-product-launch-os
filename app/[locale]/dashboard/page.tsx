import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { DashboardPanels } from "@/components/dashboard/DashboardPanels";
import type { AppLocale } from "@/i18n/routing";

export default async function DashboardPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentContainer className="py-8 sm:py-10 lg:py-12"><DashboardPanels /></ContentContainer>;
}
