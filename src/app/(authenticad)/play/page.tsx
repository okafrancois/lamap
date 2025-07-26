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
import { DebugPanel } from "@/components/common/debug-panel";
import { useKoraEngine } from "@/hooks/use-kora-engine";
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
  const [selectedCard, setSelectedCard] = useState<string | null>(null); // ID de la carte sélectionnée
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Hook du game engine Kora
  const koraEngine = useKoraEngine();

  const gameOptions = [
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
      id: "online",
      title: "Jouer en ligne",
      description: "Affrontez des joueurs du monde entier",
      icon: IconWorld,
      color: "from-blue-500 to-blue-600",
      difficulty: "Dynamique",
      players: "2 joueurs",
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
    koraEngine.startGame();
    console.log(`Démarrage du mode: ${gameMode} avec le Game Engine Kora`);
  };

  const handleCardClick = (cardId: string) => {
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  const handlePlayCard = () => {
    if (selectedCard) {
      const success = koraEngine.playCard(selectedCard);
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
    return koraEngine.playerCards[index];
  };

  const handleLegacyCardSelect = (cardIndex: number | null) => {
    if (cardIndex === null) {
      setSelectedCard(null);
    } else {
      const card = getCardByIndex(cardIndex);
      if (card) {
        setSelectedCard(card.id);
      }
    }
  };

  const isCardSelected = (cardId: string) => {
    return selectedCard === cardId;
  };

  // Conversion du selectedCard (ID) vers l'index pour l'ancienne interface
  const getSelectedCardIndex = () => {
    if (!selectedCard) return null;
    return koraEngine.playerCards.findIndex((card) => card.id === selectedCard);
  };

  return (
    <>
      {/* Panneau de debug flottant avec support du Game Engine */}
      <DebugPanel
        phase={koraEngine.phase}
        currentTurn={koraEngine.currentTurn}
        playerCardsCount={koraEngine.playerCards.length}
        opponentCardsCount={koraEngine.opponentCards.length}
        playedCardsCount={koraEngine.playedCards.length}
        playableCards={koraEngine.playableCards}
        hoveredCard={hoveredCard}
        selectedCard={getSelectedCardIndex()}
        isAnimating={koraEngine.isAnimating}
        onPhaseChange={(phase) => {
          // Les phases sont gérées automatiquement par l'engine
          console.log("Phase change requested:", phase);
        }}
        onTurnChange={(turn) => {
          // Les tours sont gérés automatiquement par l'engine
          console.log("Turn change requested:", turn);
        }}
        onStartGame={koraEngine.startGame}
        onEndGame={koraEngine.endGame}
        onSetVictory={koraEngine.setVictory}
        onSetDefeat={koraEngine.setDefeat}
        onToggleGodMode={koraEngine.toggleGodMode}
        onForcePlayerHand={koraEngine.forcePlayerHand}
        godMode={koraEngine.godMode}
        currentRound={koraEngine.currentRound}
        playerKoras={koraEngine.playerKoras}
        opponentKoras={koraEngine.opponentKoras}
        onPlayRandomCard={() => {
          // Jouer une carte aléatoire parmi les cartes jouables
          const playableCards = koraEngine.getPlayableCards("player");
          if (playableCards.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * playableCards.length,
            );
            const randomCard = playableCards[randomIndex];
            if (randomCard) {
              koraEngine.playCard(randomCard.id);
            }
          }
        }}
        onSetPlayableCards={() => {
          // Géré automatiquement par l'engine
          console.log("Set playable cards requested");
        }}
        onSimulateHover={handleCardHover}
        onSimulateSelect={handleLegacyCardSelect}
      />

      <PageContainer className="flex flex-col gap-6 lg:flex-row">
        {/* Plateau de jeu - Colonne de gauche */}
        <GameBoard
          playerCards={koraEngine.playerCards}
          opponentCards={koraEngine.opponentCards}
          playedCards={koraEngine.playedCards}
          gameStarted={koraEngine.phase === "playing"}
          isPlayerTurn={
            koraEngine.currentTurn === "player" &&
            koraEngine.phase === "playing"
          }
          playableCards={koraEngine.playableCards}
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
          currentTurn={koraEngine.currentTurn}
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
                <CardDescription>
                  Choisissez votre façon de jouer
                </CardDescription>
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
                      {isSelected
                        ? "Commencer avec Kora Engine"
                        : "Sélectionner"}
                    </LibButton>
                  </CardContent>
                </Card>
              );
            })}

            {/* Section d'informations du Game Engine */}
            {koraEngine.phase === "playing" && (
              <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                <CardContent className="space-y-3 p-4 text-center">
                  <div className="mx-auto w-fit rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 p-2">
                    <IconCards className="size-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-cyan-700 dark:text-cyan-300">
                      Kora Battle Engine
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Tour {koraEngine.currentRound}/5 -
                      {koraEngine.currentTurn === "player"
                        ? " Votre tour"
                        : " Tour adversaire"}
                    </p>
                    <div className="mt-2 flex justify-between text-xs">
                      <span>Vos Koras: {koraEngine.playerKoras}</span>
                      <span>Adversaire: {koraEngine.opponentKoras}</span>
                    </div>
                    {koraEngine.godMode && (
                      <div className="mt-1 text-xs text-red-400">
                        🔓 Mode God actif
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
