import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-graphite/70">{hint}</span> : null}
    </label>
  );
}

export const inputClassName =
  "min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink shadow-sm transition placeholder:text-graphite/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

