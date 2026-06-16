import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function HeroDemo() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <Image
        src="/hero-workspace.png"
        alt="商品企劃工作桌與上市報告預覽"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-48"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,20,23,0.94),rgba(18,20,23,0.72),rgba(18,20,23,0.28))]" />

      <div className="page-shell relative grid min-h-[76vh] items-center py-14 sm:py-20">
        <div className="max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              PAQ Product Launch OS
            </p>
            <Badge tone="teal" className="border-white/10 bg-white/10 text-white">
              Demo Mode · 使用範例資料展示流程
            </Badge>
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
            上傳商品資料，AI 產出完整商品上市企劃書
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/82 sm:text-lg sm:leading-8">
            從商品定位、客群分析、競品差異、包裝設計 brief、商品頁文案，到社群貼文、短影音腳本、FAQ 與首月行銷計畫，一次整理成可展示、可討論、可複製的上市報告。
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72 sm:text-base">
            適合小品牌、文創商品、3C 配件、生活選物、香氛禮盒、學生創業專案與電商賣家。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-base font-semibold text-ink transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              開始建立商品企劃
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="#demo-products"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/22 px-5 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              查看 Demo 商品
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
