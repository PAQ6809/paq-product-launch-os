import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ContentContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("content-container", className)} {...props} />;
}
