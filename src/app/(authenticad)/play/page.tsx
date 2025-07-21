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
import { type Card as DeckCard } from "@/components/common/deck";
import { GameBoard } from "@/components/common/game-board";
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
      <GameBoard
        playerCards={playerCards}
        opponentCards={opponentCards}
        playedCards={playedCards}
        gameStarted={selectedGameMode !== null}
        className="h-full overflow-hidden rounded-lg p-0 lg:w-4/6"
      />

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
