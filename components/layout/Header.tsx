import { PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { UserMenu } from "@/components/auth/UserMenu";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Link } from "@/i18n/navigation";

export function Header() {
  const t = useTranslations("nav");
  const navItems = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/products", label: t("products") },
    { href: "/reports/collections", label: t("reports") },
    { href: "/settings/security", label: t("security") },
    { href: "/products/new", label: t("create") },
    { href: "/products/arc-snap-power-bank/report", label: t("demo") }
  ];

  return (
    <header className="sticky top-0 z-30 overflow-x-clip border-b border-line bg-white/92 backdrop-blur">
      <ContentContainer className="flex min-h-16 min-w-0 flex-wrap items-center justify-between gap-2 py-2">
        <Link href="/" className="flex min-w-0 max-w-[14rem] shrink items-center gap-2 rounded-md font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:max-w-[18rem] lg:max-w-none">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-white">
            <PackageCheck size={18} aria-hidden="true" />
          </span>
          <span className="hidden min-w-0 truncate sm:inline">{t("brand")}</span>
          <span className="min-w-0 truncate sm:hidden">{t("shortBrand")}</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <nav aria-label={t("main")} className="hidden min-w-0 flex-1 items-center justify-end gap-1 xl:flex">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className="inline-flex min-h-11 max-w-36 min-w-0 items-center truncate whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-graphite transition hover:bg-mist hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </ContentContainer>
    </header>
  );
}
