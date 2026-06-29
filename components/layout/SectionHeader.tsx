import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, eyebrow, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <p className="text-sm font-semibold text-teal-600">{eyebrow}</p> : null}
        <h2 className={cn("break-words text-2xl font-semibold leading-tight text-ink sm:text-3xl", eyebrow && "mt-3")}>
          {title}
        </h2>
        {description ? <p className="mt-3 break-words text-sm leading-6 text-graphite/75">{description}</p> : null}
      </div>
      {action ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{action}</div> : null}
    </div>
  );
}
