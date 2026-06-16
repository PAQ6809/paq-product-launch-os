import { BarChart3, FileText, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: BarChart3,
    title: "商品定位與市場分析",
    text: "把商品功能、客群、價格與通路整理成清楚定位，快速找到可溝通的上市切入點。"
  },
  {
    icon: FileText,
    title: "包裝與商品頁文案",
    text: "產出包裝方向、正背面文案、商品頁標題與長短描述，讓商品可以被理解與比較。"
  },
  {
    icon: Megaphone,
    title: "社群素材與首月行銷計畫",
    text: "整理社群貼文、短影音腳本、FAQ、客服話術與首月節奏，降低上市前準備成本。"
  }
];

export function FeatureGrid() {
  return (
    <section className="page-shell py-14 sm:py-20">
      <div className="mb-8 flex flex-col gap-3 sm:max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
          核心功能
        </p>
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
          從商品資料到上市素材，先把能賣的說法整理出來
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card
              key={feature.title}
              className="p-5 transition duration-200 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-panel"
            >
              <Icon className="mb-5 h-6 w-6 text-teal-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-graphite/75">{feature.text}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
