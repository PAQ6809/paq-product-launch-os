"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, inputClassName } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";

function safeRedirect(value: string | null) {
  return value?.startsWith("/") ? value : "/dashboard";
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => safeRedirect(searchParams.get("redirectTo")), [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setMessage(t("missingConfig"));
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  async function sendMagicLink() {
    if (!supabase || !email.trim()) {
      setMessage(supabase ? t("emailRequired") : t("missingConfig"));
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` }
    });
    setLoading(false);
    setMessage(error ? error.message : t("magicSent"));
  }

  return (
    <AuthCard eyebrow={t("eyebrow")} title={t("loginTitle")} description={t("loginDescription")}>
      <form className="grid gap-4" onSubmit={handlePasswordLogin}>
        <Field label={t("email")} htmlFor="email">
          <input id="email" className={inputClassName} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label={t("password")} htmlFor="password">
          <input id="password" className={inputClassName} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </Field>
        <Button type="submit" disabled={loading}>
          <ShieldCheck size={17} aria-hidden="true" />
          {loading ? t("loading") : t("login")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => void sendMagicLink()} disabled={loading}>
          <Mail size={17} aria-hidden="true" />
          {t("sendMagicLink")}
        </Button>
      </form>
      {message ? <p className="rounded-md border border-line bg-mist px-3 py-2 text-sm font-semibold text-graphite/80" aria-live="polite">{message}</p> : null}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="font-semibold text-teal-600" href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}>{t("needAccount")}</Link>
        <Link className="font-semibold text-graphite hover:text-ink" href="/reset-password">{t("forgotPassword")}</Link>
      </div>
    </AuthCard>
  );
}
