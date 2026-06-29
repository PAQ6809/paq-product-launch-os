import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ eyebrow, title, description, children }: AuthCardProps) {
  return (
    <Card className="mx-auto grid w-full max-w-md gap-6 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-teal-600">{eyebrow}</p>
        <h1 className="mt-2 break-words text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 break-words text-sm leading-6 text-graphite/72">{description}</p>
      </div>
      {children}
    </Card>
  );
}
