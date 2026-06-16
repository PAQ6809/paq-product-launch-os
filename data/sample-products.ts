import type { Product } from "@/types";
import type { LaunchReportInput } from "@/types/report";

export type SampleProduct = LaunchReportInput & {
  id: string;
  lifecycleStatus: Product["lifecycleStatus"];
  createdAt: string;
  latestReportTitle: string;
  pendingReviewCount: number;
};

export const sampleProductInputs: SampleProduct[] = [
  {
    id: "island-paper-bookmark",
    productName: "島嶼紙感書籤組",
    category: "文創小物",
    features:
      "以台灣島嶼、山線與老窗花為靈感，使用厚磅再生紙、局部燙金與手感壓紋，適合送禮與日常閱讀收藏。",
    cost: 72,
    targetPrice: 320,
    targetAudience:
      "喜歡閱讀、手帳、台灣設計與小型禮物的 20-35 歲族群，常在 Pinkoi、展會或 IG 發現新品牌。",
    brandStyle: "溫暖、細膩、有台灣文化感，但不要太觀光紀念品化",
    salesChannels: ["Pinkoi", "IG", "市集"],
    imageUrl: "/hero-workspace.png",
    lifecycleStatus: "packaging",
    createdAt: "2026-06-15T09:20:00.000Z",
    latestReportTitle: "島嶼紙感書籤組商品上市企劃書",
    pendingReviewCount: 5
  },
  {
    id: "arc-snap-power-bank",
    productName: "ArcSnap MagSafe 薄型行動電源",
    category: "3C 配件",
    features:
      "5000mAh、MagSafe 磁吸、薄型金屬外殼、支援快充，主打通勤與短途旅行的輕量補電。",
    cost: 460,
    targetPrice: 1290,
    targetAudience:
      "經常外出、使用 iPhone、重視桌面與隨身物品質感的上班族與自由工作者。",
    brandStyle: "俐落、科技感、可信任，不浮誇",
    salesChannels: ["Shopify", "蝦皮", "TikTok Shop"],
    imageUrl: "/hero-workspace.png",
    lifecycleStatus: "listing",
    createdAt: "2026-06-14T14:30:00.000Z",
    latestReportTitle: "ArcSnap MagSafe 薄型行動電源商品上市企劃書",
    pendingReviewCount: 7
  },
  {
    id: "after-rain-aroma-set",
    productName: "After Rain 雨後擴香禮盒",
    category: "生活香氛",
    features:
      "以雨後木質調、青草與微甜白茶為主軸，搭配霧面玻璃瓶與補充香氛，適合臥室、書桌與送禮。",
    cost: 260,
    targetPrice: 880,
    targetAudience:
      "重視居家儀式感、喜歡溫柔中性香氣、願意為生活質感付費的 25-45 歲族群。",
    brandStyle: "安靜、療癒、成熟、帶一點精品感",
    salesChannels: ["品牌官網", "IG", "Pinkoi"],
    imageUrl: "/hero-workspace.png",
    lifecycleStatus: "marketing",
    createdAt: "2026-06-13T18:10:00.000Z",
    latestReportTitle: "After Rain 雨後擴香禮盒商品上市企劃書",
    pendingReviewCount: 4
  }
];

export const sampleProducts: Product[] = sampleProductInputs.map((product) => ({
  id: product.id,
  name: product.productName,
  category: product.category,
  features: product.features,
  cost: product.cost,
  expectedPrice: product.targetPrice,
  targetAudience: product.targetAudience,
  brandStyle: product.brandStyle,
  salesPlatforms: product.salesChannels,
  lifecycleStatus: product.lifecycleStatus,
  imageUrl: product.imageUrl,
  createdAt: product.createdAt,
  latestReportTitle: product.latestReportTitle,
  pendingReviewCount: product.pendingReviewCount
}));

export function getSampleProductInputById(id: string) {
  return sampleProductInputs.find((product) => product.id === id) ?? sampleProductInputs[0];
}
