import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Activity, FileCheck2, ShieldCheck } from "lucide-react";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getDeveloperDiagnostics } from "@/lib/dev/diagnostics";
import { requireDeveloper } from "@/lib/auth/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DeveloperConsolePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const access = await requireDeveloper(locale);
  const diagnostics = await getDeveloperDiagnostics(access);
  const isDemoMode = diagnostics.access.mode === "demo";

  return (
    <ContentContainer className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        eyebrow={
          <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {isDemoMode ? "Demo Developer Mode" : "Developer Console"}
          </span>
        }
        title="Developer Console"
        description="Server-side role protected diagnostics for PAQ Product Launch OS. This page shows safe status only and never renders raw API keys or secrets."
        actions={
          <>
            <Link className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600" href="/dev/ai-diagnostics">
              AI diagnostics
            </Link>
            <Link className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600" href="/dev/help-diagnostics">
              Help diagnostics
            </Link>
          </>
        }
      />

      {isDemoMode ? (
        <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Supabase is not configured, so this console is running in demo diagnostics mode. Formal developer access requires a Supabase session and a `profiles.role` value of `developer` or `admin`.
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SafeStatusCard icon={<ShieldCheck size={18} aria-hidden="true" />} title="Identity">
          <StatusRow label="Email" value={diagnostics.access.email ?? "Demo only"} />
          <StatusRow label="Role" value={diagnostics.access.role} />
          <StatusRow label="Supabase configured" value={diagnostics.system.supabaseConfigured ? "true" : "false"} />
        </SafeStatusCard>

        <SafeStatusCard icon={<Activity size={18} aria-hidden="true" />} title="Providers">
          <StatusRow label="AI_PROVIDER" value={diagnostics.providers.aiProvider} />
          <StatusRow label="HELP_AI_PROVIDER" value={diagnostics.providers.helpAIProvider} />
          <StatusRow label="Public real AI" value={diagnostics.providers.publicRealAIEnabled ? "true" : "false"} />
          <StatusRow label="Public Help AI" value={diagnostics.providers.publicHelpAIEnabled ? "true" : "false"} />
          <StatusRow label="OpenAI key configured" value={diagnostics.providers.openAIKeyConfigured ? "true" : "false"} />
          <StatusRow label="NVIDIA key configured" value={diagnostics.providers.nvidiaKeyConfigured ? "true" : "false"} />
        </SafeStatusCard>

        <SafeStatusCard icon={<FileCheck2 size={18} aria-hidden="true" />} title="Quality gates">
          <StatusRow label="i18n status" value={diagnostics.i18n.ok ? "passing" : "needs review"} />
          <StatusRow label="Locale files" value={String(diagnostics.i18n.localeFiles)} />
          <StatusRow label="i18n issues" value={String(diagnostics.i18n.issueCount)} />
          <StatusRow label="Secret redaction" value={diagnostics.system.secretRedaction} />
        </SafeStatusCard>
      </div>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg font-semibold text-ink">Rate limit status</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StatusBlock
            title="Generate report API"
            rows={[
              ["enabled", diagnostics.rateLimit.generateReport.enabled ? "true" : "false"],
              ["window seconds", String(diagnostics.rateLimit.generateReport.windowSeconds)],
              ["max requests", String(diagnostics.rateLimit.generateReport.maxRequests)]
            ]}
          />
          <StatusBlock
            title="Help chat API"
            rows={[
              ["enabled", diagnostics.rateLimit.helpChat.enabled ? "true" : "false"],
              ["window seconds", String(diagnostics.rateLimit.helpChat.windowSeconds)],
              ["max requests", String(diagnostics.rateLimit.helpChat.maxRequests)]
            ]}
          />
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg font-semibold text-ink">Developer docs</h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-graphite/80 sm:grid-cols-2">
          <li><code>docs/developer-role.md</code></li>
          <li><code>docs/api-safety.md</code></li>
          <li><code>docs/ai-help-center.md</code></li>
          <li><code>docs/frontend-quality-checklist.md</code></li>
        </ul>
      </section>
    </ContentContainer>
  );
}

function SafeStatusCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
        {icon}
        {title}
      </div>
      <dl className="mt-4 grid gap-3">{children}</dl>
    </section>
  );
}

function StatusBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-md border border-line bg-mist/40 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <dl className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <StatusRow key={label} label={label} value={value} />
        ))}
      </dl>
    </div>
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
