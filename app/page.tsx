import { DemoPreview } from "@/components/home/DemoPreview";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { HeroDemo } from "@/components/home/HeroDemo";
import { OutputPreview } from "@/components/home/OutputPreview";

export default function HomePage() {
  return (
    <main>
      <HeroDemo />
      <FeatureGrid />
      <OutputPreview />
      <DemoPreview />
    </main>
  );
}
