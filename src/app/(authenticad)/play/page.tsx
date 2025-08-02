"use client";

import { useGameController } from "@/hooks/use-game-controller";
import { GameBoard } from "common/game-board";
import { VictoryModal } from "common/victory-modal";
import { GameReviewSheet } from "common/game-review-sheet";
import { PageContainer } from "@/components/layout/page-container";
import { LibButton } from "@/components/library/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LibTitle } from "@/components/library/title";
import {
  IconCards,
  IconRefresh,
  IconPlayerPlay,
  IconStar,
} from "@tabler/icons-react";
import { GAME_MODES, AI_DIFFICULTIES } from "@/config/game-modes";

export default function PlayPage() {
  const controller = useGameController();
  const { game, ui } = controller;

  return (
    <PageContainer fluid={true} className="relative flex h-full">
      {/* Interface Mobile - Layout vertical complet */}
      <div className="flex h-full w-full flex-col lg:hidden">
        {/* Plateau de jeu mobile - Pleine largeur */}
        <div className="flex-1 overflow-hidden">
          <GameBoard
            playerCards={game.playerCards}
            opponentCards={game.opponentCards}
            playedCards={game.playedCards}
            gameStarted={game.phase === "playing"}
            isPlayerTurn={
              game.currentTurn === "player" && game.phase === "playing"
            }
            playableCards={game.playableCards}
            onCardClick={(cardIndex) => {
              const cardId = game.playerCards[cardIndex]?.id;
              if (cardId) {
                controller.selectCard(cardId);
              }
            }}
            onPlayCard={controller.playCard}
            hoveredCard={ui.hoveredCard}
            selectedCard={controller.getSelectedCardIndex()}
            onCardHover={controller.hoverCard}
            currentTurn={game.currentTurn}
            playerWithHand={game.playerWithHand}
            className="h-full p-2"
          />
        </div>

        {/* Contrôles mobiles compacts en bas */}
        {game.phase === "playing" && (
          <div className="bg-background/95 border-t p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-xs font-bold text-white">
                  {game.currentRound}
                </div>
                <span className="text-muted-foreground">
                  {game.currentTurn === "player"
                    ? "Votre tour"
                    : game.isAIThinking
                      ? "IA réfléchit..."
                      : "Tour de l'IA"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs">
                  {game.playerKoras} vs {game.opponentKoras}
                </span>
                <LibButton
                  variant="ghost"
                  size="sm"
                  onClick={controller.newGame}
                  className="h-8 w-8 p-0"
                >
                  <IconRefresh className="size-4" />
                </LibButton>
              </div>
            </div>
          </div>
        )}

        {/* Menu de sélection de mode pour mobile */}
        {game.phase === "waiting" && (
          <div className="bg-background/95 border-t p-4 backdrop-blur-sm">
            <div className="space-y-3">
              <h3 className="text-center font-semibold">
                Choisir un mode de jeu
              </h3>

              {/* Mode IA sélectionné */}
              {ui.selectedGameMode === "ai" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Difficulté IA</span>
                    <LibButton
                      variant="ghost"
                      size="sm"
                      onClick={() => controller.selectGameMode(null)}
                      className="text-xs"
                    >
                      ← Retour
                    </LibButton>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {AI_DIFFICULTIES.map((difficulty) => (
                      <LibButton
                        key={difficulty.id}
                        variant={
                          ui.aiDifficulty === difficulty.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          controller.setAIDifficulty(difficulty.id)
                        }
                      >
                        {difficulty.shortLabel}
                      </LibButton>
                    ))}
                  </div>
                  <LibButton
                    className="w-full"
                    onClick={() => controller.startGame("ai")}
                    icon={<IconPlayerPlay className="size-4" />}
                  >
                    Commencer
                  </LibButton>
                </div>
              ) : (
                /* Sélection du mode */
                <div className="grid grid-cols-1 gap-2">
                  {GAME_MODES.filter((option) => option.available).map(
                    (option) => {
                      const IconComponent = option.icon;
                      return (
                        <LibButton
                          key={option.id}
                          variant="outline"
                          className="flex items-center justify-start gap-3 p-3"
                          onClick={() =>
                            controller.selectGameMode(
                              option.id as "ai" | "online" | "friend",
                            )
                          }
                        >
                          <div
                            className={`rounded-lg bg-gradient-to-br p-1 ${option.color} text-white`}
                          >
                            <IconComponent className="size-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{option.title}</div>
                            <div className="text-muted-foreground text-xs">
                              {option.description}
                            </div>
                          </div>
                        </LibButton>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interface Desktop - Layout horizontal original */}
      <div className="hidden h-full w-full gap-4 lg:flex">
        {/* Plateau de jeu - Largeur adaptative */}
        <GameBoard
          playerCards={game.playerCards}
          opponentCards={game.opponentCards}
          playedCards={game.playedCards}
          gameStarted={game.phase === "playing"}
          isPlayerTurn={
            game.currentTurn === "player" && game.phase === "playing"
          }
          playableCards={game.playableCards}
          onCardClick={(cardIndex) => {
            const cardId = game.playerCards[cardIndex]?.id;
            if (cardId) {
              controller.selectCard(cardId);
            }
          }}
          onPlayCard={controller.playCard}
          hoveredCard={ui.hoveredCard}
          selectedCard={controller.getSelectedCardIndex()}
          onCardHover={controller.hoverCard}
          currentTurn={game.currentTurn}
          playerWithHand={game.playerWithHand}
          className={`overflow-hidden rounded-lg p-0 transition-all duration-700 ease-in-out ${
            game.phase === "playing" ? "lg:w-full" : "lg:w-4/6"
          }`}
        />

        {game.phase !== "playing" && (
          <Card
            className={`h-full w-2/6 pt-0 transition-all duration-700 ease-in-out`}
          >
            <CardHeader className="from-secondary/10 to-primary/10 border-b bg-gradient-to-r !p-3">
              <LibTitle as="h3" className="flex w-full items-center gap-3">
                <div className="bg-secondary/20 rounded-lg p-2">
                  <IconCards className="text-secondary size-6" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Kora Battle</span>
                  <CardDescription>
                    Choisissez votre mode de jeu
                  </CardDescription>
                </div>
              </LibTitle>
            </CardHeader>

            <CardContent className="max-h-full space-y-4 overflow-y-scroll">
              {/* État de la partie - Simplifié */}
              {(game.phase as any) === "playing" && (
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
                          Tour {game.currentRound}/5 -
                          {game.currentTurn === "player"
                            ? " Votre tour"
                            : game.isAIThinking
                              ? " IA réfléchit..."
                              : " Tour de l&apos;IA"}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span>Vos Koras: {game.playerKoras}</span>
                      <span>IA: {game.opponentKoras}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Options de difficulté pour l'IA */}
              {ui.selectedGameMode === "ai" && game.phase === "waiting" && (
                <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/10 !p-4">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <LibTitle
                      as="h3"
                      className="flex w-full items-center gap-3"
                    >
                      <div className="bg-secondary/20 rounded-lg p-2">
                        <IconCards className="text-secondary size-6" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">
                          Difficulté de l&apos;IA
                        </span>
                      </div>
                    </LibTitle>
                    <LibButton
                      variant="ghost"
                      size="sm"
                      onClick={() => controller.selectGameMode(null)}
                      className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                      ← Retour
                    </LibButton>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {AI_DIFFICULTIES.map((difficulty) => (
                        <LibButton
                          key={difficulty.id}
                          variant={
                            ui.aiDifficulty === difficulty.id
                              ? "default"
                              : "outline"
                          }
                          className="w-full justify-start"
                          onClick={() =>
                            controller.setAIDifficulty(difficulty.id)
                          }
                        >
                          {difficulty.label}
                        </LibButton>
                      ))}
                    </div>
                    <LibButton
                      className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => controller.startGame("ai")}
                      icon={<IconPlayerPlay className="size-4" />}
                    >
                      🚀 Commencer la partie
                    </LibButton>
                  </CardContent>
                </Card>
              )}

              {/* Modes de jeu - Masqués si un mode est sélectionné */}
              {!ui.selectedGameMode &&
                GAME_MODES.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = ui.selectedGameMode === option.id;

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
                        option.available &&
                        controller.selectGameMode(
                          option.id as "ai" | "online" | "friend",
                        )
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
                                controller.startGame(
                                  option.id as "ai" | "online" | "friend",
                                );
                              } else {
                                controller.selectGameMode(
                                  option.id as "ai" | "online" | "friend",
                                );
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
        )}
      </div>

      {/* Modal de victoire/défaite */}
      <VictoryModal
        isVisible={ui.showVictoryModal}
        isVictory={game.phase === "victory"}
        playerKoras={game.playerKoras}
        opponentKoras={game.opponentKoras}
        betAmount={game.currentBet}
        korasWon={controller.engine.getKorasWonThisGame?.() ?? 0}
        gameLog={game.gameLog}
        onPlayAgain={() => {
          ui.actions.hideVictory();
          controller.newGame();
        }}
        onClose={() => {
          ui.actions.hideVictory();
          controller.selectGameMode(null);
        }}
        onEnterReview={() => {
          ui.actions.hideVictory();
          ui.actions.showReview();
        }}
      />

      {/* Sheet de review */}
      <GameReviewSheet
        open={ui.showReviewSheet}
        onOpenChange={ui.actions.hideReview}
      />
    </PageContainer>
  );
}
