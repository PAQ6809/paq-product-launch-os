import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex min-w-0 flex-col gap-5 md:flex-row md:items-start md:justify-between", className)}>
      <div className="min-w-0 max-w-4xl">
        {eyebrow ? <div className="mb-3 text-sm font-semibold text-teal-600">{eyebrow}</div> : null}
        <h1 className="break-words text-2xl font-semibold leading-tight text-ink sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-graphite/75 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">{actions}</div> : null}
    </header>
  );
}
