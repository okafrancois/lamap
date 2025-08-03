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
  IconRobot,
} from "@tabler/icons-react";
import { GAME_MODES, AI_DIFFICULTIES } from "@/config/game-modes";
import { useUserDataContext } from "@/components/layout/user-provider";
import { useState } from "react";
import type { AIDifficulty } from "@/engine/kora-game-engine";
import { useSearchParams } from "next/navigation";

export default function PlayPage() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");

  const controller = useGameController(gameId);
  const { gameState, ui } = controller;
  const userData = useUserDataContext();

  if (!userData) {
    return <div>Vous devez être connecté pour jouer</div>;
  }

  return (
    <PageContainer
      fluid={true}
      className="relative flex h-full overflow-hidden"
    >
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
                  onClick={() => window.location.reload()}
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
                  window.location.reload();
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

        {!gameId && (
          <Card
            className={`hidden h-full w-2/6 pt-0 transition-all duration-700 ease-in-out lg:block`}
          >
            <CardHeader className="from-secondary/10 to-primary/10 mb-4 border-b bg-gradient-to-r !p-3">
              <LibTitle as="h3" className="flex w-full items-center gap-3">
                <div className="bg-secondary/20 rounded-lg p-2">
                  <IconCards className="text-secondary size-icon" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Kora Battle</span>
                  <CardDescription>
                    Choisissez votre mode de jeu
                  </CardDescription>
                </div>
              </LibTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <VsIaGameMode
                isSelected={ui.selectedGameMode === "ai"}
                onTrigger={() => controller.selectGameMode("ai")}
                onClose={() => controller.selectGameMode(null)}
                onNewGame={() => controller.startGame("ai")}
                hidden={Boolean(
                  ui.selectedGameMode && ui.selectedGameMode !== "ai",
                )}
              />

              <OnlineGameMode
                isSelected={ui.selectedGameMode === "online"}
                onTrigger={() => controller.selectGameMode("online")}
                onClose={() => controller.selectGameMode(null)}
                onNewGame={() => controller.startGame("online")}
                hidden={Boolean(
                  ui.selectedGameMode && ui.selectedGameMode !== "online",
                )}
              />
            </CardContent>
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

type VsIaGameModeProps = {
  isSelected: boolean;
  onTrigger: () => void;
  onClose: () => void;
  onNewGame: (difficulty: AIDifficulty) => void;
  hidden: boolean;
};

function VsIaGameMode({
  isSelected,
  onTrigger,
  onClose,
  onNewGame,
  hidden,
}: VsIaGameModeProps) {
  const modeData = GAME_MODES.find((mode) => mode.id === "ai");

  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");

  if (!modeData || hidden) {
    return null;
  }

  if (isSelected)
    return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <LibTitle as="h3" className="flex w-full items-center gap-2">
            <div className="bg-secondary/20 rounded-lg p-1">
              <IconCards className="text-secondary size-icon" />
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
            onClick={onClose}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            ← Retour
          </LibButton>
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-2">
            {AI_DIFFICULTIES.map((difficultyItem) => (
              <LibButton
                key={difficultyItem.id}
                variant={
                  difficulty === difficultyItem.id ? "default" : "outline"
                }
                className="w-full justify-start"
                onClick={() => setDifficulty(difficultyItem.id)}
              >
                {difficultyItem.label}
              </LibButton>
            ))}
          </div>
          <LibButton
            className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => onNewGame(difficulty)}
            icon={<IconPlayerPlay className="size-4" />}
          >
            🚀 Commencer la partie
          </LibButton>
        </CardContent>
      </Card>
    );

  return (
    <Card
      className={`border-gray-300 p-4 ${
        isSelected
          ? "border-primary shadow-primary/20 scale-[1.02] shadow-lg hover:shadow-lg"
          : "border-border hover:border-primary/50 hover:shadow-lg"
      }`}
      onClick={onTrigger}
    >
      <CardHeader className="p-0">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg bg-gradient-to-br p-1 ${modeData.color} text-white`}
          >
            <IconRobot className="size-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {modeData.title}
              {isSelected && (
                <IconStar className="text-primary fill-primary size-4" />
              )}
              {!modeData.available && (
                <span className="text-xs text-gray-500">(Bientôt)</span>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <p className="text-muted-foreground text-sm">{modeData.description}</p>

        <LibButton
          className={`mt-3 w-full ${
            isSelected && modeData.available
              ? "bg-primary hover:bg-primary/90"
              : "variant-outline"
          }`}
          onClick={onTrigger}
          disabled={!modeData.available}
          icon={<IconPlayerPlay className="size-4" />}
        >
          {!modeData.available
            ? "Indisponible"
            : isSelected
              ? "Commencer la partie"
              : "Sélectionner"}
        </LibButton>
      </CardContent>
    </Card>
  );
}

type OnlineGameModeProps = {
  isSelected: boolean;
  onTrigger: () => void;
  onClose: () => void;
  onNewGame: () => void;
  hidden: boolean;
};

function OnlineGameMode({
  isSelected,
  onTrigger,
  onClose,
  onNewGame,
  hidden,
}: OnlineGameModeProps) {
  const modeData = GAME_MODES.find((mode) => mode.id === "online");
  const [option, setOption] = useState<"create" | "join" | null>(null);

  if (!modeData || hidden) {
    return null;
  }

  const CreateGameForm = () => {
    return (
      <div>
        <h1>Créer une partie</h1>
      </div>
    );
  };

  const GamesList = () => {
    return (
      <div>
        <h1>Liste des parties</h1>
      </div>
    );
  };

  if (isSelected)
    return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <LibTitle as="h3" className="flex w-full items-center gap-2">
            <div className="bg-secondary/20 rounded-lg p-1">
              <IconCards className="text-secondary size-icon" />
            </div>
            <div>
              <span className="text-lg font-semibold">Mode en ligne</span>
            </div>
          </LibTitle>
          <LibButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            ← Retour
          </LibButton>
        </CardHeader>

        <CardContent className="p-0">
          {!option && (
            <div className="space-y-2">
              <LibButton className="w-full" onClick={() => setOption("create")}>
                Créer une partie
              </LibButton>
              <LibButton className="w-full" onClick={() => setOption("join")}>
                Rejoindre une partie
              </LibButton>
            </div>
          )}
          {option && (
            <div className="flex flex-col gap-2">
              <LibButton
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
                onClick={onNewGame}
                icon={<IconPlayerPlay className="size-4" />}
              >
                🚀 Commencer la partie
              </LibButton>
              <LibButton
                className="w-full text-sm"
                onClick={() => setOption(null)}
                variant={"link"}
              >
                ← Changer de mode
              </LibButton>
            </div>
          )}
        </CardContent>
      </Card>
    );

  return (
    <Card
      className={`border-gray-300 p-4 ${
        isSelected
          ? "border-primary shadow-primary/20 scale-[1.02] shadow-lg hover:shadow-lg"
          : "border-border hover:border-primary/50 hover:shadow-lg"
      }`}
      onClick={onTrigger}
    >
      <CardHeader className="p-0">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg bg-gradient-to-br p-1 ${modeData.color} text-white`}
          >
            <IconRobot className="size-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {modeData.title}
              {isSelected && (
                <IconStar className="text-primary fill-primary size-4" />
              )}
              {!modeData.available && (
                <span className="text-xs text-gray-500">(Bientôt)</span>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <p className="text-muted-foreground text-sm">{modeData.description}</p>

        <LibButton
          className={`mt-3 w-full ${
            isSelected && modeData.available
              ? "bg-primary hover:bg-primary/90"
              : "variant-outline"
          }`}
          onClick={onTrigger}
          disabled={!modeData.available}
          icon={<IconPlayerPlay className="size-4" />}
        >
          {!modeData.available
            ? "Indisponible"
            : isSelected
              ? "Commencer la partie"
              : "Sélectionner"}
        </LibButton>
      </CardContent>
    </Card>
  );
}
