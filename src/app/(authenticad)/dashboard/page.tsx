import { ChartAreaInteractive } from "@/components/layout/chart-area-interactive";
import { SectionCards } from "@/components/layout/section-cards";

import { PageContainer } from "@/components/layout/page-container";

export default function Page() {
  return (
    <PageContainer>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </PageContainer>
  );
}
