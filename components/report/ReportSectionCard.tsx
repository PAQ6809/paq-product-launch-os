import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";

type ReportSectionCardProps = {
  id?: string;
  title: string;
  description?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  copyText?: string;
  copyLabel?: string;
  children: ReactNode;
  className?: string;
};

export function ReportSectionCard({
  id,
  title,
  description,
  badges,
  actions,
  copyText,
  copyLabel,
  children,
  className
}: ReportSectionCardProps) {
  return (
    <article className={cn("surface min-w-0 scroll-mt-24 overflow-hidden p-5 sm:p-6", className)} id={id}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold leading-7 text-ink sm:text-xl">{title}</h2>
          {description ? <p className="mt-2 break-words text-sm leading-6 text-graphite/70">{description}</p> : null}
          {badges ? <div className="mt-3 flex min-w-0 flex-wrap gap-2">{badges}</div> : null}
        </div>
        {actions || copyText ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {copyText ? <CopyButton text={copyText} label={copyLabel} /> : null}
            {actions}
          </div>
        ) : null}
      </div>
      <div className="mt-5 min-w-0 break-words">{children}</div>
    </article>
  );
}
