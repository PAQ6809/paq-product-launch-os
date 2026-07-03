import { setRequestLocale } from "next-intl/server";
import { BrainCircuit, ShieldCheck } from "lucide-react";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { requireDeveloper } from "@/lib/auth/roles";
import { getDeveloperDiagnostics } from "@/lib/dev/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AIDiagnosticsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const access = await requireDeveloper(locale);
  const diagnostics = await getDeveloperDiagnostics(access);

  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        eyebrow="Developer Console"
        title="AI diagnostics"
        description="Safe server-side overview for report generation providers. Secrets are redacted and represented only as configured/not configured."
        actions={
          <Link className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600" href="/dev">
            Back to console
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <BrainCircuit size={18} aria-hidden="true" />
            Provider status
          </div>
          <dl className="mt-4 grid gap-3">
            <StatusRow label="AI_PROVIDER" value={diagnostics.providers.aiProvider} />
            <StatusRow label="Public real AI enabled" value={diagnostics.providers.publicRealAIEnabled ? "true" : "false"} />
            <StatusRow label="Real AI login required" value={diagnostics.providers.realAIRequireLogin ? "true" : "false"} />
            <StatusRow label="OpenAI key configured" value={diagnostics.providers.openAIKeyConfigured ? "true" : "false"} />
            <StatusRow label="NVIDIA key configured" value={diagnostics.providers.nvidiaKeyConfigured ? "true" : "false"} />
            <StatusRow label="Selected provider key ready" value={diagnostics.realAIReadiness.keyConfigured ? "true" : "false"} />
            <StatusRow label="Production forced mock" value={diagnostics.realAIReadiness.productionForcedMock ? "true" : "false"} />
          </dl>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ShieldCheck size={18} aria-hidden="true" />
            Safety status
          </div>
          <dl className="mt-4 grid gap-3">
            <StatusRow label="Secret redaction" value={diagnostics.system.secretRedaction} />
            <StatusRow label="Real AI rate limit" value={diagnostics.rateLimit.realAI.enabled ? "enabled" : "disabled"} />
            <StatusRow label="Window seconds" value={String(diagnostics.rateLimit.realAI.windowSeconds)} />
            <StatusRow label="Max requests" value={String(diagnostics.rateLimit.realAI.maxRequests)} />
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
