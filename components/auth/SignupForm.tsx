"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, inputClassName } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";

function safeRedirect(value: string | null) {
  return value?.startsWith("/") ? value : "/dashboard";
}

export function SignupForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => safeRedirect(searchParams.get("redirectTo")), [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setMessage(t("missingConfig"));
      return;
    }
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      }
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) {
      router.push(redirectTo);
      router.refresh();
      return;
    }
    setMessage(t("signupCheckEmail"));
  }

  return (
    <AuthCard eyebrow={t("eyebrow")} title={t("signupTitle")} description={t("signupDescription")}>
      <form className="grid gap-4" onSubmit={handleSignup}>
        <Field label={t("displayName")} htmlFor="display-name">
          <input id="display-name" className={inputClassName} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </Field>
        <Field label={t("email")} htmlFor="email">
          <input id="email" className={inputClassName} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label={t("password")} htmlFor="password">
          <input id="password" className={inputClassName} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </Field>
        <Button type="submit" disabled={loading}>
          <UserPlus size={17} aria-hidden="true" />
          {loading ? t("loading") : t("signup")}
        </Button>
      </form>
      <div className="min-h-10" aria-live="polite">
        {message ? <p className="rounded-md border border-line bg-mist px-3 py-2 text-sm font-semibold text-graphite/80">{message}</p> : null}
      </div>
      <Link className="text-sm font-semibold text-teal-600" href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>{t("hasAccount")}</Link>
    </AuthCard>
  );
}
