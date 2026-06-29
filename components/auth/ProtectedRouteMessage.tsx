import { LockKeyhole } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "@/i18n/navigation";

export function ProtectedRouteMessage({ loginHref }: { loginHref: string }) {
  return (
    <EmptyState
      icon={LockKeyhole}
      title="需要登入才能同步雲端工作區"
      description="本機 demo 仍可使用；登入後可把商品、報告與草稿同步到 Supabase workspace。"
      action={
        <Link href={loginHref} className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
          前往登入
        </Link>
      }
    />
  );
}
