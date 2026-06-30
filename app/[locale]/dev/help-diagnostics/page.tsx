import { setRequestLocale } from "next-intl/server";
import { LifeBuoy, ShieldCheck } from "lucide-react";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { requireDeveloper } from "@/lib/auth/roles";
import { getDeveloperDiagnostics } from "@/lib/dev/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HelpDiagnosticsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const access = await requireDeveloper(locale);
  const diagnostics = await getDeveloperDiagnostics(access);

  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        eyebrow="Developer Console"
        title="Help Center diagnostics"
        description="Safe server-side overview for the AI Help Center provider, public AI switch, and help chat rate limit."
        actions={
          <Link className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600" href="/dev">
            Back to console
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <LifeBuoy size={18} aria-hidden="true" />
            Help provider
          </div>
          <dl className="mt-4 grid gap-3">
            <StatusRow label="HELP_AI_PROVIDER" value={diagnostics.providers.helpAIProvider} />
            <StatusRow label="Public Help AI enabled" value={diagnostics.providers.publicHelpAIEnabled ? "true" : "false"} />
            <StatusRow label="NVIDIA key configured" value={diagnostics.providers.nvidiaKeyConfigured ? "true" : "false"} />
          </dl>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ShieldCheck size={18} aria-hidden="true" />
            Help safety
          </div>
          <dl className="mt-4 grid gap-3">
            <StatusRow label="Secret redaction" value={diagnostics.system.secretRedaction} />
            <StatusRow label="Help rate limit" value={diagnostics.rateLimit.helpChat.enabled ? "enabled" : "disabled"} />
            <StatusRow label="Window seconds" value={String(diagnostics.rateLimit.helpChat.windowSeconds)} />
            <StatusRow label="Max requests" value={String(diagnostics.rateLimit.helpChat.maxRequests)} />
          </dl>
        </section>
      </div>
    </ContentContainer>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 text-sm">
      <dt className="text-graphite/70">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
