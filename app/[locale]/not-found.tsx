import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <main className="page-shell grid min-h-[70vh] place-items-center py-12">
      <div className="surface max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-ink">找不到這個頁面</h1>
        <p className="mt-3 text-sm leading-6 text-graphite/75">
          這個連結可能已失效，或頁面已移動。你可以回到 Dashboard 繼續管理商品企劃。
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-graphite"
        >
          回到 Dashboard
        </Link>
      </div>
    </main>
  );
}
