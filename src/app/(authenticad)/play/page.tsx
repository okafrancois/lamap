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
import { VictoryModal } from "@/components/common/victory-modal";
import { GameReviewSheet } from "@/components/common/game-review-sheet";
import { SoundControls } from "@/components/common/sound-controls";

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
import { useState, useEffect } from "react";
import { LibTitle } from "@/components/library/title";
import { useSound } from "@/hooks/use-sound";

export default function PlayPage() {
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showReviewSheet, setShowReviewSheet] = useState(false);

  // Hook pour jouer contre l'IA
  const aiGame = useAIGame(aiDifficulty);

  // Hook pour les sons
  const { playSound } = useSound();

  // Détecter la fin de partie et afficher le modal
  useEffect(() => {
    if (aiGame.phase === "victory" || aiGame.phase === "defeat") {
      void playSound("game_end");
      setShowVictoryModal(true);
    }
  }, [aiGame.phase, playSound]);

  // Détecter les changements de tour pour jouer le son
  useEffect(() => {
    if (aiGame.phase === "playing") {
      void playSound("turn_change", { volume: 0.4 });
    }
  }, [aiGame.currentTurn, aiGame.phase, playSound]);

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
      void playSound("game_start");
      aiGame.startAIGame();
    }
  };

  const handleCardClick = (cardId: string) => {
    void playSound("card_select");
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
        void playSound("card_play");
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
    void playSound("shuffle_cards");
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
          {/* État de la partie - Simplifié */}
          {aiGame.phase === "playing" && (
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <div className="w-fit rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 p-2">
                    <IconCards className="size-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-cyan-700 dark:text-cyan-300">
                      Partie en cours
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Tour {aiGame.currentRound}/5 -
                      {aiGame.currentTurn === "player"
                        ? " Votre tour"
                        : aiGame.isAIThinking
                          ? " IA réfléchit..."
                          : " Tour de l&apos;IA"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <span>Vos Koras: {aiGame.playerKoras}</span>
                  <span>IA: {aiGame.opponentKoras}</span>
                </div>
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

      {/* Bulle compacte en bas à droite */}
      {aiGame.phase === "playing" && (
        <div className="animate-in slide-in-from-bottom-4 fixed right-4 bottom-4 z-50 duration-500">
          <div className="rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-sm text-white shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span>Tour {aiGame.currentRound}/5</span>
              <span className="text-yellow-400">•</span>
              <span>
                {aiGame.playerKoras} vs {aiGame.opponentKoras}
              </span>
              <LibButton
                variant="ghost"
                size="sm"
                onClick={handleNewGame}
                className="ml-1 h-6 w-6 p-0 text-white/70 hover:text-white"
              >
                <IconRefresh className="size-3" />
              </LibButton>
            </div>
          </div>
        </div>
      )}

      {/* Contrôles audio en bas à gauche */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="rounded-lg border border-white/20 bg-black/80 px-2 py-1 shadow-xl backdrop-blur-sm">
          <SoundControls className="[&_button]:text-white/70 [&_button:hover]:text-white [&_span]:text-white/70" />
        </div>
      </div>

      {/* Modal de victoire/défaite */}
      <VictoryModal
        isVisible={showVictoryModal}
        isVictory={aiGame.phase === "victory"}
        playerKoras={aiGame.playerKoras}
        opponentKoras={aiGame.opponentKoras}
        betAmount={aiGame.currentBet}
        korasWon={(() => {
          // Calculer les vrais gains à partir des logs
          const recentLogs = aiGame.gameLog.slice(-10);

          for (const log of recentLogs) {
            const message = log.message;

            // Extraire les gains des messages de gains
            const gainRegex = /(?:Vous gagnez|Adversaire gagne) (\d+) koras/;
            const gainMatch = gainRegex.exec(message);
            if (gainMatch?.[1] && message.includes("Vous gagnez")) {
              return parseInt(gainMatch[1]);
            }
          }

          // Par défaut, retourner la mise de base
          return aiGame.currentBet;
        })()}
        gameLog={aiGame.gameLog}
        onPlayAgain={() => {
          setShowVictoryModal(false);
          handleNewGame();
        }}
        onClose={() => {
          setShowVictoryModal(false);
          setSelectedGameMode(null);
        }}
        onEnterReview={() => {
          setShowVictoryModal(false);
          setShowReviewSheet(true);
        }}
      />

      {/* Sheet de review */}
      <GameReviewSheet
        open={showReviewSheet}
        onOpenChange={setShowReviewSheet}
      />
    </PageContainer>
  );
}
