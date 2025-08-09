"use client";

import { cn } from "@/lib/utils";
import { BackgroundDecorations } from "./background-decorations";
import { GameTable } from "./game-table";
import { PlayerArea } from "./player-area";
import { InGameVictoryModal } from "./in-game-victory-modal";
import type { Game } from "@/engine/kora-game-engine";
import { GameStatus } from "@prisma/client";

interface GameBoardProps {
  gameState: Game | null;
  currentUserId: string;
  className?: string;
  onCardClick?: (cardIndex: number) => void;
  onOpponentCardClick?: (cardIndex: number) => void;
  onPlayCard?: () => void;
  hoveredCard?: number | null;
  selectedCard?: number | null;
  onCardHover?: (cardIndex: number | null) => void;
  godMode?: boolean;

  // Props pour multijoueur
  gameId?: string;
  connectionStatus?: "connected" | "disconnected" | "reconnecting";

  // Callbacks pour multijoueur
  onPlayerJoin?: (playerId: string) => void;
  onPlayerLeave?: (playerId: string) => void;
  onGameSync?: (gameState: unknown) => void;
  onConnectionChange?: (
    status: "connected" | "disconnected" | "reconnecting",
  ) => void;

  // Props pour afficher la victoire dans le GameBoard
  showVictoryModal?: boolean;
  victoryData?: {
    isVictory: boolean;
    playerKoras: number;
    opponentKoras: number;
    betAmount: number;
    korasWon: number;
    victoryType: {
      type: string;
      title: string;
      description: string;
      multiplier: string;
      special: boolean;
    };
    victoryMessage: string;
  };
  onCloseVictory?: () => void;
  onNewGame?: () => void;
  onBackToSelection?: () => void;

  // Props pour l'état en attente
  isWaitingForOpponent?: boolean;
  canJoinGame?: boolean;
  onJoinGame?: () => void;
  gameInfo?: {
    roomName?: string;
    bet: number;
    maxRounds: number;
  };
}

export function GameBoard({
  gameState,
  currentUserId,
  className,
  onCardClick,
  onPlayCard,
  hoveredCard,
  selectedCard,
  onCardHover,
  showVictoryModal,
  victoryData,
  onCloseVictory,
  onNewGame,
  onBackToSelection,
  isWaitingForOpponent,
  canJoinGame,
  onJoinGame,
  gameInfo,
}: GameBoardProps) {
  // Si pas de gameState, afficher un plateau vide avec message d'attente
  if (gameState?.status === GameStatus.WAITING || !gameState) {
    return (
      <div
        className={cn(
          "relative flex h-full flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "safe-area-inset-y",
          className,
        )}
      >
        {/* Décorations d'arrière-plan */}
        <BackgroundDecorations />

        {/* Zone adversaire vide */}
        <div className="relative z-10 flex-shrink-0 px-2 py-1 sm:p-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="text-sm text-white/70">Adversaire</div>
            </div>
          </div>
        </div>

        {/* Zone de jeu centrale */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4">
          <div className="relative aspect-[6/4] max-h-[500px] w-auto max-w-[500px] min-w-[300px] lg:min-w-[400px]">
            <div className="relative h-full w-full rounded-2xl border-4 border-amber-400/80 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 shadow-2xl">
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-white/90">
                  {isWaitingForOpponent ? (
                    <>
                      <div className="text-lg font-semibold">
                        En attente d&apos;un adversaire...
                      </div>
                      <div className="text-sm text-white/70">
                        {gameInfo?.roomName ?? "Partie multijoueur"}
                      </div>
                      <div className="mt-2 text-xs text-white/50">
                        Mise: {gameInfo?.bet} koras • {gameInfo?.maxRounds}{" "}
                        tours
                      </div>
                      <ul className="mt-2 flex list-disc flex-col items-center justify-center gap-2 text-sm">
                        {gameState?.players.map((player) => (
                          <li key={player.username}>@{player.username}</li>
                        ))}
                      </ul>
                    </>
                  ) : canJoinGame ? (
                    <>
                      <div className="text-lg font-semibold">
                        Rejoindre la partie ?
                      </div>
                      <div className="text-sm text-white/70">
                        {gameInfo?.roomName ?? "Partie multijoueur"}
                      </div>
                      <div className="mt-2 text-xs text-white/50">
                        Mise: {gameInfo?.bet} koras • {gameInfo?.maxRounds}{" "}
                        tours
                      </div>
                      <button
                        onClick={onJoinGame}
                        className="mt-4 rounded-lg bg-amber-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-amber-600"
                      >
                        Rejoindre
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold">
                        Prêt à jouer ?
                      </div>
                      <div className="text-sm text-white/70">
                        Sélectionnez un mode de jeu
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone joueur vide */}
        <div className="relative min-h-max py-8 text-center">
          <div className="text-sm text-white/70">Vos cartes</div>
        </div>
      </div>
    );
  }

  // Extraire les données du Game
  const currentPlayer = gameState.players.find(
    (p) => p.username === currentUserId,
  );
  const opponentPlayer = gameState.players.find(
    (p) => p.username !== currentUserId,
  );

  return (
    <div
      className={cn(
        "relative flex h-full flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "safe-area-inset-y",
        className,
      )}
    >
      {/* Décorations d'arrière-plan */}
      <BackgroundDecorations />

      <div className="relative z-10 flex-shrink-0">
        <PlayerArea
          player={opponentPlayer}
          gameState={gameState}
          onCardClick={undefined} // L'adversaire n'est pas cliquable
          onPlayCard={undefined}
          hoveredCard={undefined}
          selectedCard={undefined}
          onCardHover={undefined}
        />
      </div>

      {/* Zone de jeu centrale */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4">
        <div className="relative w-full max-w-[95%] md:max-w-[80%] lg:max-w-[45%]">
          {/* Modal de victoire intégrée dans le plateau */}
          {showVictoryModal && victoryData && (
            <InGameVictoryModal
              isVisible={true}
              victoryData={victoryData}
              onClose={
                onCloseVictory ??
                (() => {
                  /* noop */
                })
              }
              onNewGame={
                onNewGame ??
                (() => {
                  /* noop */
                })
              }
              onBackToSelection={
                onBackToSelection ??
                (() => {
                  /* noop */
                })
              }
            />
          )}

          {/* Plateau de jeu normal */}
          <GameTable playedCards={gameState.playedCards} />
        </div>
      </div>

      {/* Zone joueur avec infos de statut */}
      {currentPlayer && (
        <div className="relative">
          <PlayerArea
            player={currentPlayer}
            gameState={gameState}
            onCardClick={onCardClick}
            onPlayCard={onPlayCard}
            hoveredCard={hoveredCard}
            selectedCard={selectedCard}
            onCardHover={onCardHover}
          />
        </div>
      )}
    </div>
  );
}
