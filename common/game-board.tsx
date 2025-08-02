"use client";

import { cn } from "@/lib/utils";
import { BackgroundDecorations } from "./background-decorations";
import { GameTable } from "./game-table";
import { OpponentArea, PlayerArea } from "./player-area";
import type { GameState } from "@/engine/kora-game-engine";

interface GameBoardProps {
  gameState: GameState | null;
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
  onGameStateSync?: (gameState: unknown) => void;
  onConnectionChange?: (
    status: "connected" | "disconnected" | "reconnecting",
  ) => void;
}

export function GameBoard({
  gameState,
  currentUserId,
  className,
  onCardClick,
  onOpponentCardClick,
  onPlayCard,
  hoveredCard,
  selectedCard,
  onCardHover,
  godMode = false,

  // Props multijoueur avec valeurs par défaut
  gameId,
  connectionStatus = "connected",

  // Callbacks multijoueur (optionnels)
  onPlayerJoin,
  onPlayerLeave,
  onGameStateSync,
  onConnectionChange,
}: GameBoardProps) {
  // Si pas de gameState, afficher un plateau vide
  if (!gameState) {
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
              <div className="text-muted-foreground text-sm">Adversaire</div>
            </div>
          </div>
        </div>

        {/* Zone de jeu centrale */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4">
          <div className="relative aspect-[6/4] max-h-[500px] w-auto max-w-[500px] min-w-[300px] lg:min-w-[400px]">
            <div className="relative h-full w-full rounded-2xl border-4 border-amber-400/80 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 shadow-2xl">
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-white/90">
                  <div className="text-lg font-semibold">Prêt à jouer ?</div>
                  <div className="text-sm text-white/70">Sélectionnez un mode de jeu</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone joueur vide */}
        <div className="relative min-h-max py-8 text-center">
          <div className="text-muted-foreground text-sm">Vos cartes</div>
        </div>
      </div>
    );
  }

  // Extraire les données du GameState
  const currentPlayer = gameState.players.find((p) => p.id === currentUserId);
  const opponentPlayer = gameState.players.find((p) => p.id !== currentUserId);

  const gameStarted = gameState.status === "playing";
  const isPlayerTurn = gameState.playerTurnId === currentUserId;
  const currentTurn =
    gameState.playerTurnId === currentUserId ? "player" : "opponent";
  const playerWithHand =
    gameState.hasHandId === currentUserId ? "player" : "opponent";

  // Calculer les cartes jouables (indices)
  const playableCards: number[] = [];
  if (currentPlayer?.hand) {
    currentPlayer.hand.forEach((card, index) => {
      if (card.jouable) {
        playableCards.push(index);
      }
    });
  }
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

      {/* Zone adversaire */}
      <OpponentArea
        cards={opponentPlayer?.hand ?? []}
        currentTurn={currentTurn}
        gameStarted={gameStarted}
        hasHand={playerWithHand === "opponent"}
        godMode={godMode}
        onOpponentCardClick={onOpponentCardClick}
        playableCards={playableCards}
        gameId={gameId}
        connectionStatus={connectionStatus}
        round={gameState.currentRound}
        maxRounds={gameState.maxRounds}
      />

      {/* Zone de jeu centrale */}
      <GameTable playedCards={gameState.playedCards} />

      {/* Zone joueur */}
      <PlayerArea
        cards={currentPlayer?.hand ?? []}
        isPlayerTurn={isPlayerTurn}
        gameStarted={gameStarted}
        hasHand={playerWithHand === "player"}
        onCardClick={onCardClick}
        onPlayCard={onPlayCard}
        hoveredCard={hoveredCard}
        selectedCard={selectedCard}
        onCardHover={onCardHover}
        playableCards={playableCards}
      />
    </div>
  );
}
