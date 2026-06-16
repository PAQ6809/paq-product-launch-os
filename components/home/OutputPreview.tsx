import { CheckCircle2 } from "lucide-react";

const outputs = [
  "商品定位",
  "目標客群分析",
  "核心賣點",
  "競品差異",
  "定價建議",
  "包裝設計 brief",
  "商品頁文案",
  "社群貼文",
  "短影音腳本",
  "FAQ 與客服話術",
  "首月行銷計畫",
  "銷售後優化建議"
];

export function OutputPreview() {
  return (
    <section className="border-y border-line bg-mist py-14 sm:py-20">
      <div className="page-shell">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
            你會得到什麼？
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
            一份可以拿去開會、提案、修改與上架前審核的上市報告
          </h2>
          <p className="mt-4 text-sm leading-6 text-graphite/75">
            內容會拆成可複製的 section，方便貼到商品頁、社群貼文、包裝 brief 或內部討論文件。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {outputs.map((output) => (
            <div
              key={output}
              className="flex min-h-14 items-center gap-3 rounded-md border border-line bg-white px-4 py-3"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" aria-hidden="true" />
              <span className="text-sm font-semibold text-ink">{output}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
