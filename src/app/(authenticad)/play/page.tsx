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
import { GameBoard } from "@/components/common/game-board";
import { useAIGame } from "@/hooks/use-ai-game";
import {
  IconRobot,
  IconUsers,
  IconWorld,
  IconPlayerPlay,
  IconStar,
  IconCards,
  IconTrophy,
  IconSkull,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";
import { LibTitle } from "@/components/library/title";

export default function PlayPage() {
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );

  // Hook pour jouer contre l'IA
  const aiGame = useAIGame(aiDifficulty);

  const gameOptions = [
    {
      id: "ai",
      title: "Jouer contre l'IA",
      description: "Entraînez-vous contre notre intelligence artificielle",
      icon: IconRobot,
      color: "from-purple-500 to-purple-600",
      difficulty: "Configurable",
      players: "1 vs IA",
      available: true,
    },
    {
      id: "online",
      title: "Jouer en ligne",
      description: "Affrontez des joueurs du monde entier",
      icon: IconWorld,
      color: "from-blue-500 to-blue-600",
      difficulty: "Dynamique",
      players: "2 joueurs",
      available: false,
    },
    {
      id: "friend",
      title: "Jouer avec un ami",
      description: "Invitez un ami pour une partie privée",
      icon: IconUsers,
      color: "from-green-500 to-green-600",
      difficulty: "Variable",
      players: "2 joueurs",
      available: false,
    },
  ];

  const handleModeSelect = (gameMode: string) => {
    setSelectedGameMode(gameMode);
  };

  const handleGameStart = () => {
    if (selectedGameMode === "ai") {
      aiGame.startAIGame();
    }
  };

  const handleCardClick = (cardId: string) => {
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  const handlePlayCard = () => {
    if (selectedCard && aiGame.currentTurn === "player") {
      const success = aiGame.playCardAgainstAI(selectedCard);
      if (success) {
        setSelectedCard(null);
      }
    }
  };

  const handleCardHover = (cardIndex: number | null) => {
    setHoveredCard(cardIndex);
  };

  // Conversion pour la compatibilité avec l'ancien système d'index
  const getCardByIndex = (index: number) => {
    return aiGame.playerCards[index];
  };

  // Conversion du selectedCard (ID) vers l'index pour l'ancienne interface
  const getSelectedCardIndex = () => {
    if (!selectedCard) return null;
    return aiGame.playerCards.findIndex((card) => card.id === selectedCard);
  };

  const handleNewGame = () => {
    setSelectedCard(null);
    setHoveredCard(null);
    aiGame.startAIGame();
  };

  return (
    <PageContainer className="relative flex h-screen flex-col gap-6 overflow-hidden lg:flex-row">
      {/* Plateau de jeu - Largeur adaptative */}
      <GameBoard
        playerCards={aiGame.playerCards}
        opponentCards={aiGame.opponentCards}
        playedCards={aiGame.playedCards}
        gameStarted={aiGame.phase === "playing"}
        isPlayerTurn={
          aiGame.currentTurn === "player" && aiGame.phase === "playing"
        }
        playableCards={aiGame.playableCards}
        onCardClick={(cardIndex) => {
          const card = getCardByIndex(cardIndex);
          if (card) {
            handleCardClick(card.id);
          }
        }}
        onPlayCard={handlePlayCard}
        hoveredCard={hoveredCard}
        selectedCard={getSelectedCardIndex()}
        onCardHover={handleCardHover}
        currentTurn={aiGame.currentTurn}
        playerWithHand={aiGame.playerWithHand}
        className={`h-full max-h-full overflow-hidden rounded-lg p-0 transition-all duration-700 ease-in-out ${
          aiGame.phase === "playing" ? "lg:w-full" : "lg:w-4/6"
        }`}
      />

      {/* Options de jeu - Colonne de droite avec animation */}
      <Card
        className={`h-full pt-0 transition-all duration-700 ease-in-out ${
          aiGame.phase === "playing"
            ? "lg:pointer-events-none lg:w-0 lg:overflow-hidden lg:opacity-0"
            : "lg:w-2/6 lg:opacity-100"
        }`}
      >
        <CardHeader className="from-secondary/10 to-primary/10 border-b bg-gradient-to-r !py-4">
          <LibTitle as="h3" className="flex w-full items-center gap-3">
            <div className="bg-secondary/20 rounded-lg p-2">
              <IconCards className="text-secondary size-6" />
            </div>
            <div>
              <span className="text-lg font-semibold">Kora Battle</span>
              <CardDescription>Choisissez votre mode de jeu</CardDescription>
            </div>
          </LibTitle>
        </CardHeader>

        <CardContent className="max-h-full space-y-4 overflow-y-scroll pt-4">
          {/* État de la partie */}
          {aiGame.phase !== "waiting" && (
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="mx-auto w-fit rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 p-2">
                      {aiGame.phase === "victory" ? (
                        <IconTrophy className="size-5 text-white" />
                      ) : aiGame.phase === "defeat" ? (
                        <IconSkull className="size-5 text-white" />
                      ) : (
                        <IconCards className="size-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-cyan-700 dark:text-cyan-300">
                        {aiGame.phase === "victory"
                          ? "Victoire !"
                          : aiGame.phase === "defeat"
                            ? "Défaite !"
                            : "Partie en cours"}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {aiGame.phase === "playing" && (
                          <>
                            Tour {aiGame.currentRound}/5 -
                            {aiGame.currentTurn === "player"
                              ? " Votre tour"
                              : aiGame.isAIThinking
                                ? " IA réfléchit..."
                                : " Tour de l&apos;IA"}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {(aiGame.phase === "victory" ||
                    aiGame.phase === "defeat") && (
                    <LibButton
                      variant="outline"
                      size="sm"
                      onClick={handleNewGame}
                      icon={<IconRefresh className="size-4" />}
                    >
                      Rejouer
                    </LibButton>
                  )}
                </div>

                {aiGame.phase === "playing" && (
                  <div className="flex justify-between text-xs">
                    <span>Vos Koras: {aiGame.playerKoras}</span>
                    <span>IA: {aiGame.opponentKoras}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Options de difficulté pour l'IA */}
          {selectedGameMode === "ai" && aiGame.phase === "waiting" && (
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-300">
                    Difficulté de l&apos;IA
                  </h4>
                  <LibButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGameMode(null)}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    ← Retour
                  </LibButton>
                </div>
                <div className="space-y-2">
                  {(["easy", "medium", "hard"] as const).map((difficulty) => (
                    <LibButton
                      key={difficulty}
                      variant={
                        aiDifficulty === difficulty ? "default" : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() => setAiDifficulty(difficulty)}
                    >
                      {difficulty === "easy" && "🟢 Facile"}
                      {difficulty === "medium" && "🟡 Moyen"}
                      {difficulty === "hard" && "🔴 Difficile"}
                    </LibButton>
                  ))}
                </div>
                <LibButton
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleGameStart}
                  icon={<IconPlayerPlay className="size-4" />}
                >
                  🚀 Commencer la partie
                </LibButton>
              </CardContent>
            </Card>
          )}

          {/* Modes de jeu - Masqués si un mode est sélectionné */}
          {!selectedGameMode &&
            gameOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedGameMode === option.id;

              return (
                <Card
                  key={option.id}
                  className={`relative cursor-pointer gap-2 border-2 p-6 transition-all duration-300 ${
                    !option.available
                      ? "cursor-not-allowed border-gray-300 opacity-50"
                      : isSelected
                        ? "border-primary shadow-primary/20 scale-[1.02] shadow-lg hover:shadow-lg"
                        : "border-border hover:border-primary/50 hover:shadow-lg"
                  }`}
                  onClick={() =>
                    option.available && handleModeSelect(option.id)
                  }
                >
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
                          {!option.available && (
                            <span className="text-xs text-gray-500">
                              (Bientôt)
                            </span>
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
                        isSelected && option.available
                          ? "bg-primary hover:bg-primary/90"
                          : "variant-outline"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (option.available) {
                          if (isSelected) {
                            handleGameStart();
                          } else {
                            handleModeSelect(option.id);
                          }
                        }
                      }}
                      disabled={!option.available}
                      icon={<IconPlayerPlay className="size-4" />}
                    >
                      {!option.available
                        ? "Indisponible"
                        : isSelected
                          ? "Commencer la partie"
                          : "Sélectionner"}
                    </LibButton>
                  </CardContent>
                </Card>
              );
            })}
        </CardContent>
      </Card>

      {/* Bulle d'information flottante pendant la partie */}
      {aiGame.phase === "playing" && (
        <div className="animate-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 duration-500">
          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-2xl backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 p-2">
                    <IconCards className="size-5 text-white" />
                  </div>
                  {aiGame.isAIThinking && (
                    <div className="absolute -top-1 -right-1">
                      <div className="h-3 w-3 animate-pulse rounded-full bg-orange-400"></div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-cyan-700 dark:text-cyan-300">
                      Tour {aiGame.currentRound}/5
                    </h4>
                    {/* Indication de qui a la main dans la bulle */}
                    <div
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        aiGame.playerWithHand === "player"
                          ? "bg-yellow-500 text-yellow-900"
                          : "bg-orange-500 text-orange-900"
                      }`}
                    >
                      👑 {aiGame.playerWithHand === "player" ? "VOUS" : "IA"}{" "}
                      avez la main
                    </div>
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        aiGame.currentTurn === "player"
                          ? "bg-green-500/20 text-green-700 dark:text-green-300"
                          : aiGame.isAIThinking
                            ? "bg-orange-500/20 text-orange-700 dark:text-orange-300"
                            : "bg-red-500/20 text-red-700 dark:text-red-300"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          aiGame.currentTurn === "player"
                            ? "bg-green-500"
                            : aiGame.isAIThinking
                              ? "animate-pulse bg-orange-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      {aiGame.currentTurn === "player"
                        ? "Votre tour"
                        : aiGame.isAIThinking
                          ? "IA réfléchit..."
                          : "Tour de l'IA"}
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-cyan-600 dark:text-cyan-400">
                    <span>Vous: {aiGame.playerKoras} koras</span>
                    <span>IA: {aiGame.opponentKoras} koras</span>
                  </div>
                </div>

                <LibButton
                  variant="ghost"
                  size="sm"
                  onClick={handleNewGame}
                  className="ml-2 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                  icon={<IconRefresh className="size-4" />}
                ></LibButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
