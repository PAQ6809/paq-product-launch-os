import type { LucideIcon } from "lucide-react";
import { FileQuestion } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon: Icon = FileQuestion, action, className }: EmptyStateProps) {
  return (
    <div className={cn("surface grid min-h-56 place-items-center p-6 text-center sm:p-8", className)}>
      <div className="max-w-md">
        <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-md bg-teal-50 text-teal-600">
          <Icon size={21} aria-hidden="true" />
        </span>
        <h2 className="mt-4 break-words text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 break-words text-sm leading-6 text-graphite/75">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
