"use client";

import { PageContainer } from "@/components/layout/page-container";
import { LibButton } from "@/components/library/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlayerDeck,
  PlayedCards,
  type Card as DeckCard,
} from "@/components/common/deck";
import {
  IconRobot,
  IconUsers,
  IconWorld,
  IconPlayerPlay,
  IconStar,
  IconCards,
} from "@tabler/icons-react";
import { useState } from "react";
import { LibTitle } from "@/components/library/title";

export default function Page() {
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);

  // Cartes d'exemple pour le plateau de jeu
  const gameCards = [
    { suit: "hearts", rank: "A" },
    { suit: "diamonds", rank: "K" },
    { suit: "clubs", rank: "Q" },
    { suit: "spades", rank: "J" },
    { suit: "hearts", rank: "10" },
  ] as const;

  // Cartes du joueur (visibles)
  const playerCards: DeckCard[] = [
    { suit: "hearts", rank: "K" },
    { suit: "diamonds", rank: "Q" },
    { suit: "clubs", rank: "J" },
    { suit: "spades", rank: "A" },
  ];

  // Cartes de l'adversaire (cachées, on ne montre que le nombre)
  const opponentCards: DeckCard[] = [
    { suit: "hearts", rank: "A" }, // Ces valeurs ne seront pas visibles
    { suit: "diamonds", rank: "K" },
    { suit: "clubs", rank: "Q" },
    { suit: "spades", rank: "J" },
  ];

  // Cartes jouées au centre
  const playedCards: DeckCard[] = [
    { suit: "diamonds", rank: "7" },
    { suit: "clubs", rank: "8" },
  ];

  const gameOptions = [
    {
      id: "online",
      title: "Jouer en ligne",
      description: "Affrontez des joueurs du monde entier",
      icon: IconWorld,
      color: "from-blue-500 to-blue-600",
      difficulty: "Dynamique",
      players: "2 joueurs",
    },
    {
      id: "ai",
      title: "Jouer contre l'IA",
      description: "Entraînez-vous contre notre intelligence artificielle",
      icon: IconRobot,
      color: "from-purple-500 to-purple-600",
      difficulty: "Configurable",
      players: "1 vs IA",
    },
    {
      id: "friend",
      title: "Jouer avec un ami",
      description: "Invitez un ami pour une partie privée",
      icon: IconUsers,
      color: "from-green-500 to-green-600",
      difficulty: "Variable",
      players: "2 joueurs",
    },
  ];

  const handleGameStart = (gameMode: string) => {
    setSelectedGameMode(gameMode);
    // Ici vous pouvez ajouter la logique pour démarrer le jeu
    console.log(`Démarrage du mode: ${gameMode}`);
  };

  return (
    <PageContainer className="flex flex-col gap-6 lg:flex-row">
      {/* Plateau de jeu - Colonne de gauche */}
      <Card className="h-full overflow-hidden p-0 lg:w-4/6">
        <CardContent className="flex h-full flex-col gap-4">
          {/* Cartes de l'adversaire (en haut) */}
          <div className="p-4">
            <div className="text-center">
              <div className="text-muted-foreground mb-3 text-sm">
                Adversaire ({opponentCards.length} cartes)
              </div>
              <PlayerDeck cards={opponentCards} isOpponent={true} />
            </div>
          </div>

          {/* Zone de cartes jouées (au milieu) */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative aspect-square w-[35%]">
              {/* Plateau de jeu avec design élaboré */}
              <div className="relative h-full w-full rounded-2xl border-4 border-amber-400/80 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 shadow-2xl">
                {/* Effet de profondeur avec ombres intérieures */}
                <div className="absolute inset-2 rounded-xl border-2 border-amber-300/30 bg-gradient-to-br from-emerald-600/20 to-emerald-900/40"></div>

                {/* Motifs décoratifs aux coins */}
                <div className="absolute top-3 left-3">
                  <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                    <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                    <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                    <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
                  </div>
                </div>
                <div className="absolute right-3 bottom-3">
                  <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                    <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
                  </div>
                </div>

                {/* Lignes de guidage décoratives */}
                <div className="absolute inset-0 rounded-2xl">
                  <svg className="h-full w-full" viewBox="0 0 200 200">
                    {/* Croix centrale */}
                    <line
                      x1="100"
                      y1="40"
                      x2="100"
                      y2="160"
                      stroke="rgba(251, 191, 36, 0.2)"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                    <line
                      x1="40"
                      y1="100"
                      x2="160"
                      y2="100"
                      stroke="rgba(251, 191, 36, 0.2)"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />

                    {/* Cercle central */}
                    <circle
                      cx="100"
                      cy="100"
                      r="25"
                      fill="none"
                      stroke="rgba(251, 191, 36, 0.3)"
                      strokeWidth="2"
                      strokeDasharray="3,3"
                    />

                    {/* Motifs en losange */}
                    <path
                      d="M70,70 L100,50 L130,70 L100,90 Z"
                      fill="none"
                      stroke="rgba(251, 191, 36, 0.15)"
                      strokeWidth="1"
                    />
                    <path
                      d="M70,130 L100,110 L130,130 L100,150 Z"
                      fill="none"
                      stroke="rgba(251, 191, 36, 0.15)"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Effet de brillance */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent"></div>

                {/* Zone des cartes au centre */}
                <div className="flex h-full items-center justify-center p-6">
                  <PlayedCards cards={playedCards} />
                </div>

                {/* Texture de feutre */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-30">
                  <div className="h-full w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-900/20"></div>
                </div>
              </div>

              {/* Ombre portée du plateau */}
              <div className="absolute -right-4 -bottom-4 h-full w-full rounded-2xl bg-black/20 blur-xl"></div>
            </div>
          </div>

          <div className="min-h-max text-center">
            <div className="text-foreground mb-3 text-sm font-medium">
              Vos cartes
            </div>
            <PlayerDeck
              cards={playerCards}
              isOpponent={false}
              hidden={!selectedGameMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Options de jeu - Colonne de droite */}
      <Card className="h-full pt-0 lg:w-2/6">
        <CardHeader className="from-secondary/10 to-primary/10 border-b bg-gradient-to-r !py-4">
          <LibTitle as="h3" className="flex w-full items-center gap-3">
            <div className="bg-secondary/20 rounded-lg p-2">
              <IconCards className="text-secondary size-6" />
            </div>
            <div>
              <span className="text-lg font-semibold">Modes de Jeu</span>
              <CardDescription>Choisissez votre façon de jouer</CardDescription>
            </div>
          </LibTitle>
        </CardHeader>

        <CardContent className="max-h-full space-y-4 overflow-y-scroll pt-2">
          {gameOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedGameMode === option.id;

            return (
              <Card
                key={option.id}
                className={`relative cursor-pointer gap-2 border-2 p-6 transition-all duration-300 hover:shadow-lg ${
                  isSelected
                    ? "border-primary shadow-primary/20 scale-[1.02] shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedGameMode(option.id)}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-5`}
                ></div>

                <CardHeader className="p-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg bg-gradient-to-br p-1 ${option.color} text-white`}
                    >
                      <IconComponent className="size-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {option.title}
                        {isSelected && (
                          <IconStar className="text-primary fill-primary size-4" />
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-1 p-0">
                  <p className="text-muted-foreground text-sm">
                    {option.description}
                  </p>

                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>{option.difficulty}</span>
                    <span>{option.players}</span>
                  </div>

                  <LibButton
                    className={`mt-3 w-full ${
                      isSelected
                        ? "bg-primary hover:bg-primary/90"
                        : "variant-outline"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGameStart(option.id);
                    }}
                    icon={<IconPlayerPlay className="size-4" />}
                  >
                    {isSelected ? "Commencer" : "Sélectionner"}
                  </LibButton>
                </CardContent>
              </Card>
            );
          })}

          {/* Bouton de défi spécial 

          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <CardContent className="space-y-3 p-4 text-center">
              <div className="mx-auto w-fit rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-2">
                <IconCrown className="size-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-700 dark:text-amber-300">
                  Défi du Champion
                </h3>
                <p className="text-muted-foreground text-xs">
                  Mode hardcore pour les experts
                </p>
              </div>
              <LibButton
                variant="outline"
                size="sm"
                className="w-full border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
                icon={<IconTrophy className="size-4" />}
              >
                Bientôt disponible
              </LibButton>
            </CardContent>
          </Card>
          
          */}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
