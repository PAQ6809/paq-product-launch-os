"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SecurityNotice } from "@/components/security/SecurityNotice";

export function SecurityCenter() {
  const [message, setMessage] = useState("");

  async function requestExport() {
    const response = await fetch("/api/account/export-data", { method: "POST" });
    setMessage(response.ok ? "Data export request created. Downloaded JSON includes metadata only." : "Sign in is required for data export.");
    if (!response.ok) return;

    const blob = new Blob([JSON.stringify(await response.json(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "paq-account-data-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function requestDelete() {
    const response = await fetch("/api/account/delete-request", { method: "POST" });
    setMessage(response.ok ? "Account deletion request recorded for manual review." : "Sign in is required for account deletion request.");
  }

  return (
    <div className="grid gap-6">
      <SecurityNotice />
      <section className="surface p-5 sm:p-6">
        <h1 className="text-2xl font-semibold text-ink">Account Security</h1>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Info label="RLS" value="Owner-only workspace tables" />
          <Info label="Encryption" value="AES-256-GCM helper for sensitive payloads" />
          <Info label="Audit" value="Export and security event logs" />
        </div>
      </section>
      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Data Actions</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/72">
          These actions create request records. Production fulfillment still needs an operational review workflow.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void requestExport()}>Export my data</Button>
          <Button type="button" variant="secondary" onClick={() => void requestDelete()}>Request account deletion</Button>
        </div>
        {message ? <p className="mt-3 text-sm font-semibold text-graphite/75">{message}</p> : null}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <p className="text-xs font-semibold text-graphite/60">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
