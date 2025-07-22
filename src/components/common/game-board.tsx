"use client";

import { PlayerDeck, PlayedCards, type Card } from "./deck";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  playerCards: Card[];
  opponentCards: Card[];
  playedCards: Card[];
  gameStarted?: boolean;
  className?: string;
  isPlayerTurn?: boolean;
  playableCards?: number[];
  onCardClick?: (cardIndex: number) => void;
  onPlayCard?: () => void;
  hoveredCard?: number | null;
  selectedCard?: number | null;
  onCardHover?: (cardIndex: number | null) => void;
  currentTurn?: "player" | "opponent";
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
  onPlayCard,
  hoveredCard,
  selectedCard,
  onCardHover,
  currentTurn = "player",
}: GameBoardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        className,
      )}
    >
      {/* Cartes de l'adversaire (en haut) */}
      <div className="relative z-10 p-4">
        <div className="text-center">
          <div
            className={`mb-3 text-sm ${currentTurn === "opponent" ? "text-amber-300" : "text-amber-200/80"}`}
          >
            Adversaire ({opponentCards.length} cartes){" "}
            {currentTurn === "opponent" && "- À son tour"}
          </div>
          <PlayerDeck cards={opponentCards} isOpponent={true} />
        </div>
      </div>

      {/* Zone de cartes jouées (au milieu) */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="relative aspect-square w-[35%]">
          <div className="relative h-full w-full rounded-xl border-2 border-emerald-600 bg-emerald-800 shadow-lg">
            <div className="flex h-full items-center justify-center p-6">
              <PlayedCards cards={playedCards} />
            </div>
          </div>
        </div>
      </div>

      {/* Cartes du joueur (en bas) */}
      <div className="relative z-10 min-h-max text-center">
        <div
          className={`mb-3 text-sm font-medium ${isPlayerTurn ? "text-amber-100" : "text-amber-100/60"}`}
        >
          Vos cartes {isPlayerTurn && "- À votre tour"}
        </div>
        <PlayerDeck
          cards={playerCards}
          isOpponent={false}
          hidden={!gameStarted}
          isPlayerTurn={isPlayerTurn}
          playableCards={playableCards}
          onCardClick={onCardClick}
          onPlayCard={onPlayCard}
          hoveredCard={hoveredCard}
          selectedCard={selectedCard}
          onCardHover={onCardHover}
        />
      </div>
    </div>
  );
}
