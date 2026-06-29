import type { LifecycleStatus } from "@/types";
import { useTranslations } from "next-intl";
import { cn, lifecycleSteps } from "@/lib/utils";

type LifecycleProgressProps = {
  status: LifecycleStatus;
  compact?: boolean;
  className?: string;
};

export function LifecycleProgress({ status, compact = false, className }: LifecycleProgressProps) {
  const t = useTranslations("lifecycle");
  const statusIndex = lifecycleSteps.indexOf(status);
  const activeIndex = status === "archived" ? lifecycleSteps.length - 1 : Math.max(0, statusIndex);

  if (compact) {
    return (
      <div className={cn("grid min-w-0 gap-2", className)} aria-label={`${t("title")}：${t(status)}`}>
        <div className="grid grid-cols-8 gap-1" aria-hidden="true">
          {lifecycleSteps.map((step, index) => (
            <span key={step} className={cn("h-2 rounded-full", index <= activeIndex ? "bg-teal-500" : "bg-line")} />
          ))}
        </div>
        <p className="break-words text-xs font-medium text-teal-600">{t("current")}：{t(status)}</p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
        <span className="break-words text-right text-sm font-medium text-teal-600">{t(status)}</span>
      </div>
      <p className="mb-2 text-xs text-graphite/60 sm:hidden">{t("scroll")}</p>
      <div className="overflow-x-auto pb-2">
        <ol className="grid min-w-[46rem] grid-cols-8 gap-2" aria-label={t("title")}>
          {lifecycleSteps.map((step, index) => {
            const isDone = index <= activeIndex;
            const isCurrent = index === activeIndex;

            return (
              <li
                key={step}
                className={cn(
                  "min-h-[4.5rem] rounded-md border px-3 py-2",
                  isDone ? "border-teal-100 bg-teal-50" : "border-line bg-white",
                  isCurrent && "ring-2 ring-teal-100"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className={cn("mb-2 h-1.5 rounded-full", isDone ? "bg-teal-500" : "bg-line")} />
                <p className="break-words text-xs font-semibold leading-5 text-ink">{t(step)}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
