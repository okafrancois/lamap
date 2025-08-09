"use client";

import { useGameController } from "@/hooks/use-game-controller";
import { GameBoard } from "common/game-board";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { AIDifficulty, GameConfig } from "@/engine/kora-game-engine";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { GameStatus } from "@prisma/client";
import { toast } from "sonner";

interface AvailableGame {
  gameId: string;
  name: string;
  hostUsername: string | null;
  currentPlayers: number;
  maxPlayers: number;
  bet: number;
  maxRounds: number;
  createdAt: Date;
}

export default function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");

  // États supprimés car gérés par le controller et l'URL

  const userData = useUserDataContext();

  const controller = useGameController(gameId);
  const { gameState, ui, gameInfo } = controller;

  // Déterminer l'état actuel
  const isCreator = gameInfo?.hostUsername === userData?.user?.username;
  const canJoinGame =
    gameId &&
    gameInfo?.status === GameStatus.WAITING &&
    gameInfo?.players.length < gameInfo.maxPlayers &&
    !isCreator;

  const currentStatus = gameId
    ? gameInfo?.status === GameStatus.ENDED
      ? "finished"
      : gameInfo?.status === GameStatus.PLAYING
        ? "playing"
        : canJoinGame
          ? "can_join"
          : gameInfo?.status === GameStatus.WAITING &&
              gameInfo?.players.length < gameInfo.maxPlayers
            ? "waiting_for_opponent"
            : "waiting"
    : "selecting";

  // Création de partie avec redirection simple
  const handleCreateGame = async (
    config: Pick<
      GameConfig,
      | "mode"
      | "aiDifficulty"
      | "currentBet"
      | "maxRounds"
      | "isPrivate"
      | "joinCode"
    >,
  ) => {
    const currentUser = userData?.user;

    if (!currentUser) {
      toast.error("Vous devez être connecté pour créer une partie");
      return;
    }

    const newGameId = controller.createGame(config, currentUser);

    router.push(`/play?id=${newGameId}`);
  };

  // Rejoindre une partie multijoueur
  const handleJoinGame = async () => {
    if (!gameId) return;

    await controller.joinGame(gameId);
  };

  // Retour à la sélection
  const backToSelection = () => {
    router.push("/play");
  };

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
            const actualGameState = controller.gameState;
            if (!actualGameState) return;

            const currentPlayer = actualGameState.players.find(
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
          showVictoryModal={ui.showVictoryModal}
          victoryData={
            gameState && controller.engine.gameState
              ? {
                  isVictory:
                    gameState?.winnerUsername === userData.user.username,
                  playerKoras:
                    gameState?.players.find(
                      (p) => p.username === userData.user.username,
                    )?.koras ?? 0,
                  opponentKoras:
                    gameState?.players.find(
                      (p) => p.username !== userData.user.username,
                    )?.koras ?? 0,
                  betAmount: gameState?.currentBet ?? 0,
                  korasWon: controller.engine.getKorasWonThisGame?.() ?? 0,
                  victoryType: controller.engine.getVictoryType?.(
                    userData.user.username,
                  ) ?? {
                    type: "normal",
                    title: "Partie terminée",
                    description: "Résultat non disponible",
                    multiplier: "x1",
                    special: false,
                  },
                  victoryMessage:
                    controller.engine.getVictoryMessage?.(
                      gameState?.winnerUsername === userData.user.username,
                    ) ?? "",
                }
              : undefined
          }
          onCloseVictory={() => ui.actions.hideVictory()}
          onNewGame={() => {
            ui.actions.hideVictory();
            controller.newGame();
          }}
          onBackToSelection={backToSelection}
          isWaitingForOpponent={currentStatus === "waiting_for_opponent"}
          canJoinGame={currentStatus === "can_join"}
          onJoinGame={handleJoinGame}
          gameInfo={
            gameInfo
              ? {
                  roomName: gameInfo.roomName ?? undefined,
                  bet: gameInfo.currentBet,
                  maxRounds: gameInfo.maxRounds,
                }
              : undefined
          }
          className={`overflow-hidden p-0 transition-all duration-700 ease-in-out lg:rounded-lg ${
            currentStatus === "selecting" ? "lg:w-4/6" : "lg:w-full"
          }`}
        />

        {/* Contrôles mobiles compacts en bas */}
        {gameState?.status === GameStatus.PLAYING && (
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
        {gameState?.status === GameStatus.ENDED && (
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

        {currentStatus === "selecting" && (
          <Card
            className={`h-2/5 w-full pt-0 transition-all duration-700 ease-in-out lg:block lg:h-full lg:w-2/6`}
          >
            <CardHeader className="from-secondary/10 to-primary/10 border-b bg-gradient-to-r !p-3 lg:mb-4">
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

            <CardContent className="space-y-4 overflow-y-auto">
              <VsIaGameMode
                isSelected={ui.selectedGameMode === "AI"}
                onTrigger={() => controller.selectGameMode("AI")}
                onClose={() => controller.selectGameMode(null)}
                onNewGame={(difficulty) =>
                  handleCreateGame({
                    mode: "AI",
                    aiDifficulty: difficulty,
                    currentBet: 0,
                    maxRounds: 5,
                    isPrivate: false,
                    joinCode: null,
                  })
                }
                hidden={Boolean(
                  ui.selectedGameMode && ui.selectedGameMode !== "AI",
                )}
              />

              <OnlineGameMode
                isSelected={ui.selectedGameMode === "ONLINE"}
                onTrigger={() => controller.selectGameMode("ONLINE")}
                onClose={() => controller.selectGameMode(null)}
                onNewGame={(config) =>
                  handleCreateGame({
                    mode: "ONLINE",
                    currentBet: config.bet,
                    maxRounds: config.maxRounds ?? 5,
                    isPrivate: false,
                    joinCode: null,
                    aiDifficulty: null,
                  })
                }
                hidden={Boolean(
                  ui.selectedGameMode && ui.selectedGameMode !== "ONLINE",
                )}
              />
            </CardContent>
          </Card>
        )}
      </div>

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
  const modeData = GAME_MODES.find((mode) => mode.id === "AI");

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
  onNewGame: (config: { bet: number; maxRounds?: number }) => void;
  hidden: boolean;
};

function OnlineGameMode({
  isSelected,
  onTrigger,
  onClose,
  onNewGame,
  hidden,
}: OnlineGameModeProps) {
  const modeData = GAME_MODES.find((mode) => mode.id === "ONLINE");
  const [option, setOption] = useState<"create" | "join" | null>(null);
  const [bet, setBet] = useState(10);
  const [maxRounds, setMaxRounds] = useState(5);

  if (!modeData || hidden) {
    return null;
  }

  const CreateGameForm = () => {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold">Configurer la partie</h4>
        <div>
          <Label className="text-sm">Mise (koras)</Label>
          <Input
            type="number"
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
            min="10"
            max="1000"
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-sm">Tours maximum</Label>
          <Select
            value={maxRounds.toString()}
            onValueChange={(value) => setMaxRounds(Number(value))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 tours</SelectItem>
              <SelectItem value="5">5 tours</SelectItem>
              <SelectItem value="7">7 tours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const GamesList = () => {
    const { data: availableGames, isLoading } =
      api.game.getAvailableGames.useQuery();
    const joinGameMutation = api.game.joinGame.useMutation();
    const router = useRouter();

    const handleJoinGame = async (gameId: string) => {
      try {
        await joinGameMutation.mutateAsync({ gameId });
        router.push(`/play?id=${gameId}`);
      } catch (error) {
        console.error("Erreur join game:", error);
      }
    };

    return (
      <div className="space-y-3">
        <h4 className="font-semibold">Parties disponibles</h4>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-muted-foreground text-center text-sm">
              Chargement...
            </div>
          ) : availableGames && availableGames.length > 0 ? (
            availableGames.map((game: AvailableGame) => (
              <div key={game.gameId} className="rounded border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div>{game.name}</div>
                    <div className="text-muted-foreground text-xs">
                      Mise: {game.bet} koras • {game.maxRounds} tours •{" "}
                      {game.currentPlayers}/{game.maxPlayers} joueurs
                    </div>
                  </div>
                  <LibButton
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleJoinGame(game.gameId)}
                  >
                    Rejoindre
                  </LibButton>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-center text-sm">
              Pas de parties disponibles
            </div>
          )}
        </div>
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
          {option === "create" && (
            <div className="space-y-3">
              <CreateGameForm />
              <div className="flex flex-col gap-2">
                <LibButton
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => onNewGame({ bet, maxRounds })}
                  icon={<IconPlayerPlay className="size-4" />}
                >
                  🚀 Créer la partie
                </LibButton>
                <LibButton
                  className="w-full text-sm"
                  onClick={() => setOption(null)}
                  variant={"link"}
                >
                  ← Retour
                </LibButton>
              </div>
            </div>
          )}
          {option === "join" && (
            <div className="space-y-3">
              <GamesList />
              <LibButton
                className="w-full text-sm"
                onClick={() => setOption(null)}
                variant={"link"}
              >
                ← Retour
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
