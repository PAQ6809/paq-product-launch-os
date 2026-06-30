"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";

export function UserMenu() {
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
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <span className="hidden max-w-40 items-center gap-1 truncate text-sm font-semibold text-graphite sm:inline-flex">
        <UserCircle size={16} aria-hidden="true" />
        {email}
      </span>
      <Button variant="ghost" size="sm" onClick={() => void signOut()}>
        <LogOut size={16} aria-hidden="true" />
        {t("signOut")}
      </Button>
    </div>
  );
}
