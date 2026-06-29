import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "teal" | "amber" | "coral";
};

const tones = {
  neutral: "border-line bg-white text-graphite",
  teal: "border-teal-100 bg-teal-50 text-teal-600",
  amber: "border-amber-100 bg-amber-100 text-amber-700",
  coral: "border-coral-100 bg-coral-100 text-coral-500"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 max-w-full items-center whitespace-normal break-words rounded-full border px-2.5 py-1 text-left text-xs font-semibold leading-4",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
