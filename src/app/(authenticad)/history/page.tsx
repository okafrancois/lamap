import { PageContainer } from "@/components/layout/page-container";
import { GameHistory } from "@/components/dashboard/game-history";
import { LibTitle } from "@/components/library/title";
import { IconClock } from "@tabler/icons-react";

export default function HistoryPage() {
  return (
    <PageContainer>
      {/* En-tête de la page */}
      <div className="mb-8">
        <LibTitle
          as="h1"
          className="flex items-center gap-3 text-3xl font-bold"
        >
          <div className="rounded-lg bg-gradient-to-br from-green-500 to-blue-600 p-2">
            <IconClock className="h-8 w-8 text-white" />
          </div>
          Historique des parties
        </LibTitle>
        <p className="text-muted-foreground mt-2">
          Consultez l&apos;historique détaillé de toutes vos parties
        </p>
      </div>

      {/* Historique complet */}
      <GameHistory />
    </PageContainer>
  );
}
