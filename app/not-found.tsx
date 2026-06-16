import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell grid min-h-[70vh] place-items-center py-12">
      <div className="surface max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-ink">找不到這個頁面</h1>
        <p className="mt-3 text-sm leading-6 text-graphite/75">
          這個 demo 可能還沒有對應商品。你可以回 Dashboard 查看目前可用的商品企劃與報告。
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-graphite"
        >
          回 Dashboard
        </Link>
      </div>
    </main>
  );
}
