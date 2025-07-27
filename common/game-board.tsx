"use client";

import { type Card } from "./deck";
import { cn } from "@/lib/utils";
import { BackgroundDecorations } from "./background-decorations";
import { GameTable } from "./game-table";
import { OpponentArea, PlayerArea } from "./player-area";
import type { PlayedCard } from "@/engine/kora-game-engine";

interface GameBoardProps {
  playerCards: Card[];
  opponentCards: Card[];
  playedCards: PlayedCard[];
  gameStarted?: boolean;
  className?: string;
  isPlayerTurn?: boolean;
  playableCards?: number[];
  onCardClick?: (cardIndex: number) => void;
  onOpponentCardClick?: (cardIndex: number) => void;
  onPlayCard?: () => void;
  hoveredCard?: number | null;
  selectedCard?: number | null;
  onCardHover?: (cardIndex: number | null) => void;
  currentTurn?: "player" | "opponent";
  godMode?: boolean;

  // Props pour multijoueur
  gameId?: string;
  playerId?: string;
  gameStatus?: "waiting" | "playing" | "ended" | "victory" | "defeat";
  connectionStatus?: "connected" | "disconnected" | "reconnecting";
  round?: number;
  maxRounds?: number;

  // Indication de qui a la main
  playerWithHand?: "player" | "opponent";

  // Callbacks pour multijoueur
  onPlayerJoin?: (playerId: string) => void;
  onPlayerLeave?: (playerId: string) => void;
  onGameStateSync?: (gameState: unknown) => void;
  onConnectionChange?: (
    status: "connected" | "disconnected" | "reconnecting",
  ) => void;
}

export function GameBoard({
  playerCards,
  opponentCards,
  playedCards,
  gameStarted = false,
  className,
  isPlayerTurn = false,
  playableCards = [],
  onCardClick,
  onOpponentCardClick,
  onPlayCard,
  hoveredCard,
  selectedCard,
  onCardHover,
  currentTurn = "player",
  godMode = false,

  // Props multijoueur avec valeurs par défaut
  gameId,
  playerId,
  gameStatus = "waiting",
  connectionStatus = "connected",
  round = 1,
  maxRounds = 5,

  // Indication de qui a la main
  playerWithHand,

  // Callbacks multijoueur (optionnels)
  onPlayerJoin,
  onPlayerLeave,
  onGameStateSync,
  onConnectionChange,
}: GameBoardProps) {
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
        cards={opponentCards}
        currentTurn={currentTurn}
        gameStarted={gameStarted}
        hasHand={playerWithHand === "opponent"}
        godMode={godMode}
        onOpponentCardClick={onOpponentCardClick}
        playableCards={playableCards}
        gameId={gameId}
        connectionStatus={connectionStatus}
        round={round}
        maxRounds={maxRounds}
      />

      {/* Zone de jeu centrale */}
      <GameTable playedCards={playedCards} />

      {/* Zone joueur */}
      <PlayerArea
        cards={playerCards}
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
