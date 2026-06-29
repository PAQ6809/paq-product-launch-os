import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("grid min-w-0 gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">{label}</label>
      {children}
      {hint ? <span className="text-xs leading-5 text-graphite/70">{hint}</span> : null}
    </div>
  );
}

export const inputClassName =
  "min-h-11 w-full max-w-full rounded-md border border-line bg-white px-3 text-sm text-ink shadow-sm transition placeholder:text-graphite/45 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";
