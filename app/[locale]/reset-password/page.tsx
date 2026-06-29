import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import type { AppLocale } from "@/i18n/routing";

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentContainer className="py-10 sm:py-14"><ResetPasswordForm /></ContentContainer>;
}
