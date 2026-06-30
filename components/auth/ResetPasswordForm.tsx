"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, inputClassName } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setMessage(t("missingConfig"));
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
    });
    setLoading(false);
    setMessage(error ? error.message : t("resetSent"));
  }

  return (
    <AuthCard eyebrow={t("eyebrow")} title={t("resetTitle")} description={t("resetDescription")}>
      <form className="grid gap-4" onSubmit={handleReset}>
        <Field label={t("email")} htmlFor="email">
          <input id="email" className={inputClassName} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Button type="submit" disabled={loading}>
          <MailCheck size={17} aria-hidden="true" />
          {loading ? t("loading") : t("sendReset")}
        </Button>
      </form>
      <div className="min-h-10" aria-live="polite">
        {message ? <p className="rounded-md border border-line bg-mist px-3 py-2 text-sm font-semibold text-graphite/80">{message}</p> : null}
      </div>
      <Link className="text-sm font-semibold text-teal-600" href="/login">{t("backLogin")}</Link>
    </AuthCard>
  );
}
