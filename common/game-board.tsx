"use client";

import { cn } from "@/lib/utils";
import { BackgroundDecorations } from "./background-decorations";
import { GameTable } from "./game-table";
import { PlayerArea } from "./player-area";
import { InGameVictoryModal } from "./in-game-victory-modal";
import { CardBack } from "./deck";
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
  // Générer un tableau de 5 indices pour les cartes retournées
  const generateCardIndices = (count = 5) => {
    return Array.from({ length: count }, (_, i) => i);
  };

  // Si pas de gameState ou partie en attente, afficher un plateau enrichi
  if (gameState?.status === GameStatus.WAITING || !gameState) {
    const cardIndices = generateCardIndices(5);

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

        {/* Zone adversaire avec cartes retournées */}
        <div className="relative z-10 flex-shrink-0 px-2 py-1 sm:p-2">
          <div className="flex items-center justify-center gap-4">
            {/* Avatar et infos adversaire */}
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-600 text-white">
                <span className="text-xs">?</span>
              </div>
              <div className="text-sm text-white/70">Adversaire</div>
            </div>

            {/* Cartes retournées de l'adversaire */}
            <div className="flex gap-1">
              {cardIndices.map((index) => (
                <div
                  key={index}
                  className="relative"
                  style={{
                    transform: `rotate(${Math.random() * 10 - 5}deg)`,
                    zIndex: index,
                  }}
                >
                  <CardBack width={24} height={32} />
                </div>
              ))}
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

        {/* Zone joueur avec cartes retournées et infos */}
        <div className="relative min-h-max py-8">
          <div className="flex items-center justify-center gap-4">
            {/* Cartes retournées du joueur */}
            <div className="flex gap-1">
              {cardIndices.map((index) => (
                <div
                  key={index}
                  className="relative"
                  style={{
                    transform: `rotate(${Math.random() * 10 - 5}deg)`,
                    zIndex: index,
                  }}
                >
                  <CardBack width={24} height={32} />
                </div>
              ))}
            </div>

            {/* Avatar et infos du joueur connecté */}
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <span className="text-xs font-bold">
                  {currentUserId?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-sm font-medium text-white/90">
                {currentUserId}
              </div>
            </div>
          </div>
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
