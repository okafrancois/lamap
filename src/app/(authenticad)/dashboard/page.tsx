import { PageContainer } from "@/components/layout/page-container";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { GameHistory } from "@/components/dashboard/game-history";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { OngoingGames } from "@/components/dashboard/ongoing-games";
import { LibTitle } from "@/components/library/title";
import { IconChartBar, IconTrophy } from "@tabler/icons-react";

export default function DashboardPage() {
  return (
    <PageContainer>
      {/* En-tête du dashboard */}
      <div className="mb-8">
        <LibTitle
          as="h1"
          className="flex items-center gap-3 text-3xl font-bold"
        >
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
            <IconChartBar className="h-8 w-8 text-white" />
          </div>
          Dashboard Kora Battle
        </LibTitle>
        <p className="text-muted-foreground mt-2">
          Suivez vos performances et votre progression au jeu
        </p>
      </div>

      {/* Parties en cours */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <OngoingGames />
        <GameHistory />
      </div>

      {/* Cartes de statistiques */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <IconTrophy className="h-5 w-5" />
          Statistiques générales
        </h2>
        <StatsCards />
      </div>

      {/* Graphiques de performance */}
      <div className="mb-8">
        <PerformanceChart />
      </div>
    </PageContainer>
  );
}
