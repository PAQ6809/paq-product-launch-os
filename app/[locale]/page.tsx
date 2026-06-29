import { setRequestLocale } from "next-intl/server";
import { DemoPreview } from "@/components/home/DemoPreview";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { HeroDemo } from "@/components/home/HeroDemo";
import { OutputPreview } from "@/components/home/OutputPreview";
import type { AppLocale } from "@/i18n/routing";

export default async function HomePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <><HeroDemo /><FeatureGrid /><OutputPreview /><DemoPreview /></>;
}
