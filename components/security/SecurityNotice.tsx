import { ShieldAlert } from "lucide-react";

export function SecurityNotice() {
  return (
    <section className="rounded-md border border-teal-100 bg-teal-50 p-5">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-ink">Security Center</h2>
          <p className="mt-2 text-sm leading-6 text-teal-800">
            Cloud workspace actions use Supabase session validation, RLS, export audit events, and optional application-level encryption for sensitive report payloads.
          </p>
        </div>
      </div>
    </section>
  );
}
