"use client";

import dynamic from "next/dynamic";
import { SAMPLE_DATA } from "@/lib/sample-data";

// Three.js/Canvasコンポーネントはクライアントのみ
const BackgroundParticles = dynamic(
  () => import("@/components/ui/BackgroundParticles"),
  { ssr: false }
);
const NavDots = dynamic(() => import("@/components/ui/NavDots"), {
  ssr: false,
});
const IntroCard = dynamic(() => import("@/components/cards/IntroCard"), {
  ssr: false,
});
const RhythmCard = dynamic(() => import("@/components/cards/RhythmCard"), {
  ssr: false,
});
const AlgorithmCard = dynamic(
  () => import("@/components/cards/AlgorithmCard"),
  { ssr: false }
);
const DataTypeCard = dynamic(
  () => import("@/components/cards/DataTypeCard"),
  { ssr: false }
);
const PortraitCard = dynamic(
  () => import("@/components/cards/PortraitCard"),
  { ssr: false }
);
const DataValueCard = dynamic(
  () => import("@/components/cards/DataValueCard"),
  { ssr: false }
);

export default function Home() {
  const data = SAMPLE_DATA;

  return (
    <>
      <BackgroundParticles />
      <NavDots />

      <IntroCard
        totalDataPoints={data.totalDataPoints}
        sourceCount={data.sources.length}
      />

      <RhythmCard
        heatmap={data.heatmap}
        peakHour={data.peakHour}
        nocturnalIndex={data.nocturnalIndex}
      />

      <AlgorithmCard
        algorithmRate={data.algorithmRate}
        youtube={data.youtube}
        subscriptions={data.subscriptions}
      />

      <DataTypeCard
        code={data.dataType.code}
        name={data.dataType.name}
        axes={data.dataType.axes}
      />

      <PortraitCard
        categories={data.categories}
        heatmap={data.heatmap}
        totalDataPoints={data.totalDataPoints}
      />

      <DataValueCard
        companies={data.dataValue.companies}
        totalAnnual={data.dataValue.totalAnnual}
        humadReturn={data.dataValue.humadReturn}
      />
    </>
  );
}
