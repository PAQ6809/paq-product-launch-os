import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SignupForm } from "@/components/auth/SignupForm";
import type { AppLocale } from "@/i18n/routing";

export default async function SignupPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ContentContainer className="py-10 sm:py-14">
      <Suspense fallback={<div className="surface mx-auto h-80 max-w-xl animate-pulse" />}>
        <SignupForm />
      </Suspense>
    </ContentContainer>
  );
}
