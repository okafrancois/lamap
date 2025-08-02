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
import { useUserDataContext } from "@/components/layout/user-provider";

export default function PlayPage() {
  const controller = useGameController();
  const { gameState, ui } = controller;
  const userData = useUserDataContext();

  if (!userData) {
    return <div>Vous devez être connecté pour jouer</div>;
  }

  return (
    <PageContainer fluid={true} className="relative flex h-full">
      {/* Interface Desktop - Layout horizontal original */}
      <div className="flex h-full w-full flex-col lg:flex-row lg:gap-4">
        {/* Plateau de jeu - Largeur adaptative */}
        <GameBoard
          gameState={gameState}
          currentUserId={userData.user.username}
          onCardClick={(cardIndex) => {
            const currentPlayer = gameState?.players.find(
              (p) => p.username === userData.user.username,
            );
            const cardId = currentPlayer?.hand?.[cardIndex]?.id;
            if (cardId) {
              controller.selectCard(cardId);
            }
          }}
          onPlayCard={controller.playCard}
          hoveredCard={ui.hoveredCard}
          selectedCard={controller.getSelectedCardIndex()}
          onCardHover={controller.hoverCard}
          className={`overflow-hidden p-0 transition-all duration-700 ease-in-out lg:rounded-lg ${
            gameState?.status === "playing" ? "lg:w-full" : "lg:w-4/6"
          }`}
        />

        {/* Contrôles mobiles compacts en bas */}
        {gameState?.status === "playing" && (
          <div className="bg-background/95 border-t p-3 backdrop-blur-sm lg:hidden">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-xs font-bold text-white">
                  {gameState?.currentRound}
                </div>
                <span className="text-muted-foreground">
                  {gameState?.playerTurnUsername === userData.user.username
                    ? "Votre tour"
                    : gameState?.players.find((p) => p.type === "ai")
                          ?.isThinking
                      ? "IA réfléchit..."
                      : "Tour de l'IA"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs">
                  {(() => {
                    const currentPlayer = gameState?.players.find(
                      (p) => p.username === userData.user.username,
                    );
                    const opponentPlayer = gameState?.players.find(
                      (p) => p.username !== userData.user.username,
                    );
                    return `${currentPlayer?.koras ?? 0} vs ${opponentPlayer?.koras ?? 0}`;
                  })()}
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

        {/* Actions rapides fin de partie */}
        {gameState?.status === "ended" && (
          <div className="bg-background/95 border-t p-3 backdrop-blur-sm lg:hidden">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                    gameState?.winnerUsername === userData.user.username
                      ? "bg-gradient-to-br from-green-500 to-emerald-500"
                      : "bg-gradient-to-br from-red-500 to-rose-500"
                  }`}
                >
                  {gameState?.winnerUsername === userData.user.username
                    ? "🏆"
                    : "💀"}
                </div>
                <span className="text-muted-foreground">
                  {gameState?.winnerUsername === userData.user.username
                    ? "Victoire !"
                    : "Défaite"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <LibButton
                  variant="outline"
                  size="sm"
                  onClick={() => controller.selectGameMode(null)}
                  className="h-8 text-xs"
                >
                  <IconCards className="mr-1 size-3" />
                  Changer mode
                </LibButton>
                <LibButton
                  variant="default"
                  size="sm"
                  onClick={controller.newGame}
                  className="h-8 text-xs"
                >
                  <IconRefresh className="mr-1 size-3" />
                  Rejouer
                </LibButton>
              </div>
            </div>
          </div>
        )}

        {/* Menu de sélection de mode pour mobile */}
        {(!gameState || gameState.status === "waiting") && (
          <div className="bg-background/95 ilborder-t p-4 backdrop-blur-sm lg:hidden">
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
                          onClick={() => controller.selectGameMode(option.id)}
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

        {(!gameState || gameState.status !== "playing") && (
          <Card
            className={`hidden h-full w-2/6 pt-0 transition-all duration-700 ease-in-out lg:block`}
          >
            <CardHeader className="from-secondary/10 to-primary/10 border-b bg-gradient-to-r !p-3">
              <LibTitle as="h3" className="flex w-full items-center gap-3">
                <div className="bg-secondary/20 rounded-lg p-2">
                  <IconCards className="text-secondary size-6" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Kora Battle</span>
                  <CardDescription>
                    {gameState?.status === "ended"
                      ? "Partie terminée - Actions rapides"
                      : "Choisissez votre mode de jeu"}
                  </CardDescription>
                </div>
              </LibTitle>
            </CardHeader>

            {/* Actions rapides fin de partie - Desktop */}
            {gameState?.status === "ended" && (
              <CardContent className="space-y-4 p-4">
                <div
                  className={`flex items-center gap-3 rounded-lg p-4 ${
                    gameState?.winnerUsername === userData.user.username
                      ? "border border-green-500/20 bg-green-500/10"
                      : "border border-red-500/20 bg-red-500/10"
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-full text-lg ${
                      gameState?.winnerUsername === userData.user.username
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {gameState?.winnerUsername === userData.user.username
                      ? "🏆"
                      : "💀"}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {gameState?.winnerUsername === userData.user.username
                        ? "Félicitations !"
                        : "Dommage..."}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {(() => {
                        const currentPlayer = gameState?.players.find(
                          (p) => p.username === userData.user.username,
                        );
                        const opponentPlayer = gameState?.players.find(
                          (p) => p.username !== userData.user.username,
                        );
                        return `${currentPlayer?.koras ?? 0} vs ${opponentPlayer?.koras ?? 0} koras`;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <LibButton
                    onClick={controller.newGame}
                    className="bg-primary hover:bg-primary/90 w-full"
                    icon={<IconRefresh className="size-4" />}
                  >
                    🚀 Rejouer (même mode)
                  </LibButton>
                  <LibButton
                    onClick={() => {
                      ui.actions.setSelectedGameMode(null);
                      controller.newGame();
                    }}
                    variant="outline"
                    className="w-full"
                    icon={<IconCards className="size-4" />}
                  >
                    🎯 Changer de mode
                  </LibButton>
                </div>
              </CardContent>
            )}

            {gameState?.status !== "ended" && (
              <CardContent className="max-h-full space-y-4 overflow-y-scroll">
                {/* Options de difficulté pour l'IA */}
                {ui.selectedGameMode === "ai" &&
                  (!gameState || gameState.status === "waiting") && (
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
                          controller.selectGameMode(option.id)
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
                                  controller.startGame(option.id);
                                } else {
                                  controller.selectGameMode(option.id);
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
            )}
          </Card>
        )}
      </div>

      {/* Modal de victoire/défaite */}
      <VictoryModal
        isVisible={ui.showVictoryModal}
        isVictory={gameState?.winnerUsername === userData.user.username}
        playerKoras={
          gameState?.players.find((p) => p.username === userData.user.username)
            ?.koras ?? 0
        }
        opponentKoras={
          gameState?.players.find((p) => p.username !== userData.user.username)
            ?.koras ?? 0
        }
        betAmount={gameState?.currentBet ?? 0}
        korasWon={
          controller.engine.gameState
            ? controller.engine.getKorasWonThisGame()
            : 0
        }
        victoryType={
          controller.engine.gameState
            ? controller.engine.getVictoryType(userData.user.username)
            : {
                type: "normal",
                title: "Partie terminée",
                description: "Résultat non disponible",
                multiplier: "x1",
                special: false,
              }
        }
        victoryMessage={
          controller.engine.gameState
            ? controller.engine.getVictoryMessage(
                gameState?.winnerUsername === userData.user.username,
              )
            : ""
        }
        onPlayAgain={() => {
          ui.actions.hideVictory();
          controller.newGame();
        }}
        onClose={() => {
          ui.actions.hideVictory();
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
