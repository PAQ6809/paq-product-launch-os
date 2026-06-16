import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-ink text-white hover:bg-graphite",
  secondary: "border border-line bg-white text-ink hover:border-teal-500 hover:text-teal-600",
  ghost: "text-graphite hover:bg-mist",
  danger: "border border-coral-100 bg-coral-100 text-coral-500 hover:bg-white"
};

const sizes = {
  sm: "h-10 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

