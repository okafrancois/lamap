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
  IconX,
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
      title: "🤖 Jouer contre l'IA",
      description: "Affrontez notre intelligence artificielle",
      color: "from-purple-500 to-purple-600",
      difficulty: "Configurable",
      available: true,
    },
    {
      id: "online",
      title: "🌍 Jouer en ligne",
      description: "Affrontez des joueurs du monde entier",
      color: "from-blue-500 to-blue-600",
      difficulty: "Dynamique",
      available: false,
    },
    {
      id: "friend",
      title: "👥 Jouer avec un ami",
      description: "Invitez un ami pour une partie privée",
      color: "from-green-500 to-green-600",
      difficulty: "Variable",
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

  const handleBackToMenu = () => {
    setSelectedGameMode(null);
    setSelectedCard(null);
    setHoveredCard(null);
  };

  // Interface en cours de jeu - Mobile First
  if (aiGame.phase === "playing") {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header Mobile Compact */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 bg-black/50 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-white">
            <span className="text-sm font-medium">
              Tour {aiGame.currentRound}/5
            </span>
            <div className="h-1 w-1 rounded-full bg-yellow-400"></div>
            <span className="text-sm">
              {aiGame.playerKoras} vs {aiGame.opponentKoras}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <SoundControls className="[&_button]:text-white/70 [&_button:hover]:text-white [&_span]:text-white/70" />

            <LibButton
              variant="ghost"
              size="sm"
              onClick={handleBackToMenu}
              className="text-white/70 hover:text-white"
              title="Retour au menu"
            >
              <IconX className="size-4" />
            </LibButton>
          </div>
        </div>

        {/* Game Board - Prend tout l'espace restant */}
        <div className="h-[calc(100vh-3.5rem-4rem)] flex-1 overflow-hidden">
          <GameBoard
            playerCards={aiGame.playerCards}
            opponentCards={aiGame.opponentCards}
            playedCards={aiGame.playedCards}
            gameStarted={true}
            isPlayerTurn={aiGame.currentTurn === "player"}
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
            className="h-full w-full"
          />
        </div>

        {/* Bottom Action Bar Mobile */}
        <div className="flex h-16 items-center justify-between border-t border-white/10 bg-black/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                aiGame.currentTurn === "player"
                  ? "animate-pulse bg-green-400"
                  : "bg-red-400"
              }`}
            ></div>
            <span className="text-sm font-medium text-white">
              {aiGame.currentTurn === "player"
                ? "🎯 Votre tour"
                : aiGame.isAIThinking
                  ? "🤔 IA réfléchit..."
                  : "⏳ Tour de l'IA"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedCard && aiGame.currentTurn === "player" && (
              <LibButton
                onClick={handlePlayCard}
                className="rounded-lg bg-green-600 px-6 py-2 font-bold text-white shadow-lg hover:bg-green-700"
              >
                ▶️ Jouer
              </LibButton>
            )}

            <LibButton
              variant="ghost"
              size="sm"
              onClick={handleNewGame}
              className="p-2 text-white/70 hover:text-white"
              title="Nouvelle partie"
            >
              <IconRefresh className="size-5" />
            </LibButton>
          </div>
        </div>

        {/* Modals */}
        <VictoryModal
          isVisible={showVictoryModal}
          isVictory={(aiGame.phase as string) === "victory"}
          playerKoras={aiGame.playerKoras}
          opponentKoras={aiGame.opponentKoras}
          betAmount={aiGame.currentBet}
          korasWon={(() => {
            const recentLogs = aiGame.gameLog.slice(-10);
            for (const log of recentLogs) {
              const message = log.message;
              const gainRegex = /(?:Vous gagnez|Adversaire gagne) (\d+) koras/;
              const gainMatch = gainRegex.exec(message);
              if (gainMatch?.[1] && message.includes("Vous gagnez")) {
                return parseInt(gainMatch[1]);
              }
            }
            return aiGame.currentBet;
          })()}
          gameLog={aiGame.gameLog}
          onPlayAgain={() => {
            setShowVictoryModal(false);
            handleNewGame();
          }}
          onClose={() => {
            setShowVictoryModal(false);
            handleBackToMenu();
          }}
          onEnterReview={() => {
            setShowVictoryModal(false);
            setShowReviewSheet(true);
          }}
        />

        <GameReviewSheet
          open={showReviewSheet}
          onOpenChange={setShowReviewSheet}
        />
      </div>
    );
  }

  // Interface Menu - Mobile First
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PageContainer className="min-h-screen p-4">
        {/* Header Mobile */}
        <div className="mb-8 pt-4 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white">
            🃏 Kora Battle
          </h1>
          <p className="text-lg text-amber-200/80">
            Choisissez votre mode de jeu
          </p>
        </div>

        {/* Mode Selection ou Configuration IA */}
        <div className="mx-auto max-w-sm space-y-4">
          {/* Configuration IA */}
          {selectedGameMode === "ai" && (
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-purple-300">
                    🤖 Configuration IA
                  </CardTitle>
                  <LibButton
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToMenu}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    ← Retour
                  </LibButton>
                </div>
                <CardDescription className="text-purple-200/70">
                  Choisissez le niveau de difficulté
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Sélecteurs de difficulté */}
                <div className="space-y-3">
                  {(["easy", "medium", "hard"] as const).map((difficulty) => (
                    <LibButton
                      key={difficulty}
                      variant={
                        aiDifficulty === difficulty ? "default" : "outline"
                      }
                      className={`w-full justify-start py-6 text-left ${
                        aiDifficulty === difficulty
                          ? "border-purple-500 bg-purple-600 text-white hover:bg-purple-700"
                          : "border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      }`}
                      onClick={() => setAiDifficulty(difficulty)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {difficulty === "easy" && "🟢"}
                          {difficulty === "medium" && "🟡"}
                          {difficulty === "hard" && "🔴"}
                        </span>
                        <div>
                          <div className="font-semibold capitalize">
                            {difficulty}
                          </div>
                          <div className="text-xs opacity-70">
                            {difficulty === "easy" && "Parfait pour débuter"}
                            {difficulty === "medium" && "Équilibré et amusant"}
                            {difficulty === "hard" && "Pour les experts"}
                          </div>
                        </div>
                      </div>
                    </LibButton>
                  ))}
                </div>

                {/* Bouton Commencer */}
                <LibButton
                  onClick={handleGameStart}
                  className="w-full rounded-xl bg-purple-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-purple-700"
                >
                  🚀 Commencer la partie
                </LibButton>
              </CardContent>
            </Card>
          )}

          {/* Options de mode de jeu */}
          {!selectedGameMode &&
            gameOptions.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer border-2 transition-all duration-300 ${
                  !option.available
                    ? "cursor-not-allowed border-gray-600 opacity-50"
                    : "border-gray-600 hover:border-gray-400 hover:shadow-xl"
                }`}
                onClick={() => option.available && handleModeSelect(option.id)}
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div
                      className={`rounded-xl bg-gradient-to-br p-3 ${option.color}`}
                    >
                      <span className="text-2xl">
                        {option.id === "ai" && "🤖"}
                        {option.id === "online" && "🌍"}
                        {option.id === "friend" && "👥"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-bold text-white">
                        {option.title}
                        {!option.available && (
                          <span className="ml-2 text-xs text-gray-400">
                            (Bientôt)
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Difficulté: {option.difficulty}</span>
                    {option.id === "ai" && <span>1 vs IA</span>}
                    {option.id !== "ai" && <span>2 joueurs</span>}
                  </div>

                  <LibButton
                    className={`w-full py-3 font-medium ${
                      option.available
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "cursor-not-allowed bg-gray-800 text-gray-500"
                    }`}
                    disabled={!option.available}
                  >
                    {option.available ? "Sélectionner" : "Indisponible"}
                  </LibButton>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Footer avec contrôles audio */}
        <div className="fixed right-4 bottom-4 left-4 flex justify-center">
          <div className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-sm">
            <SoundControls className="[&_button]:text-white/70 [&_button:hover]:text-white [&_span]:text-white/70" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
