import type { LifecycleStatus } from "@/types";
import { cn, lifecycleLabels, lifecycleSteps } from "@/lib/utils";

export function LifecycleProgress({ status }: { status: LifecycleStatus }) {
  const activeIndex = Math.max(0, lifecycleSteps.indexOf(status));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">商品生命週期</h2>
        <span className="text-sm font-medium text-teal-600">{lifecycleLabels[status]}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {lifecycleSteps.map((step, index) => {
          const isDone = index <= activeIndex;

          return (
            <div
              key={step}
              className={cn(
                "min-h-16 rounded-md border px-3 py-2",
                isDone ? "border-teal-100 bg-teal-50" : "border-line bg-white"
              )}
            >
              <div
                className={cn(
                  "mb-2 h-1.5 rounded-full",
                  isDone ? "bg-teal-500" : "bg-line"
                )}
              />
              <p className="text-xs font-semibold text-ink">{lifecycleLabels[step]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
