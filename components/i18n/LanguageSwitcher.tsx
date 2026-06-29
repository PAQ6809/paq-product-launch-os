"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeCatalog, supportedLocales, type AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("language");
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="relative inline-flex min-h-11 shrink-0 items-center rounded-md border border-line bg-white text-sm text-ink transition focus-within:border-teal-500">
      <Languages className="pointer-events-none absolute start-3" size={16} aria-hidden="true" />
      <span className="sr-only">{t("change")}</span>
      <select
        aria-label={t("change")}
        className="min-h-11 max-w-40 cursor-pointer appearance-none rounded-md bg-transparent py-2 pe-8 ps-9 font-medium outline-none"
        value={locale}
        onChange={(event) => router.replace(pathname, { locale: event.target.value as AppLocale })}
      >
        {supportedLocales.map((item) => (
          <option value={item} key={item}>
            {localeCatalog[item].name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute end-3 text-xs text-graphite/60" aria-hidden="true">⌄</span>
    </label>
  );
}
