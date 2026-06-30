"use client";

import { useEffect, useMemo, useState } from "react";
import { Code2, LogIn, LogOut, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";

type UserMenuProps = {
  roleLabel?: "Developer" | "Admin";
  showDeveloperConsole?: boolean;
};

export function UserMenu({ roleLabel, showDeveloperConsole = false }: UserMenuProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  if (!supabase || !email) {
    return (
      <div className="flex min-w-0 shrink-0 items-center gap-1">
        <Link href="/login" className="inline-flex min-h-11 max-w-24 min-w-0 items-center gap-2 truncate rounded-md px-3 py-2 text-sm font-semibold text-graphite transition hover:bg-mist hover:text-ink sm:max-w-32">
          <LogIn size={16} aria-hidden="true" />
          <span className="truncate">{t("login")}</span>
        </Link>
        <Link href="/signup" className="hidden min-h-11 max-w-32 min-w-0 items-center truncate rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-graphite lg:inline-flex">
          {t("signup")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
      <span className="hidden max-w-40 items-center gap-1 truncate text-sm font-semibold text-graphite sm:inline-flex">
        <UserCircle size={16} aria-hidden="true" />
        {email}
      </span>
      {roleLabel ? (
        <span className="hidden rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 lg:inline-flex">
          {roleLabel}
        </span>
      ) : null}
      {showDeveloperConsole ? (
        <Link
          href="/dev"
          aria-label="Developer Console"
          className="inline-flex min-h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-white text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600 md:w-auto md:px-3"
        >
          <Code2 size={16} aria-hidden="true" />
          <span className="hidden md:inline">Developer Console</span>
        </Link>
      ) : null}
      <Button variant="ghost" size="sm" onClick={() => void signOut()}>
        <LogOut size={16} aria-hidden="true" />
        {t("signOut")}
      </Button>
    </div>
  );
}
