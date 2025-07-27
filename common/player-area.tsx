import { PlayerDeck, type Card } from "./deck";
import { OpponentStatus, PlayerStatus } from "./player-status";
import { CircularDecoration } from "./decorative-icons";

interface BasePlayerAreaProps {
  cards: Card[];
  gameStarted: boolean;
  hasHand: boolean;
  playableCards?: number[];
  className?: string;
}

interface OpponentAreaProps extends BasePlayerAreaProps {
  currentTurn: "player" | "opponent";
  godMode?: boolean;
  onOpponentCardClick?: (cardIndex: number) => void;
  gameId?: string;
  connectionStatus?: "connected" | "disconnected" | "reconnecting";
  round?: number;
  maxRounds?: number;
}

interface PlayerAreaProps extends BasePlayerAreaProps {
  isPlayerTurn: boolean;
  onCardClick?: (cardIndex: number) => void;
  onPlayCard?: () => void;
  hoveredCard?: number | null;
  selectedCard?: number | null;
  onCardHover?: (cardIndex: number | null) => void;
}

export function OpponentArea({
  cards,
  currentTurn,
  gameStarted,
  hasHand,
  godMode = false,
  onOpponentCardClick,
  playableCards = [],
  gameId,
  connectionStatus = "connected",
  round,
  maxRounds,
  className = "",
}: OpponentAreaProps) {
  const isOpponentTurn = currentTurn === "opponent";

  return (
    <div
      className={`relative z-10 flex-shrink-0 px-2 py-1 sm:p-2 ${className}`}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <OpponentStatus
            isOpponentTurn={isOpponentTurn}
            cardCount={cards.length}
            hasHand={hasHand}
            gameStarted={gameStarted}
          />

          {/* Indicateurs multijoueur */}
          {gameId && (
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-400"
                    : connectionStatus === "reconnecting"
                      ? "animate-pulse bg-yellow-400"
                      : "bg-red-400"
                }`}
                title={`Connexion: ${connectionStatus}`}
              />
              {round && maxRounds && (
                <span className="text-xs text-amber-300/60">
                  {round}/{maxRounds}
                </span>
              )}
            </div>
          )}
        </div>

        <PlayerDeck
          cards={cards}
          isOpponent={true}
          revealOpponentCards={godMode}
          onCardClick={godMode ? onOpponentCardClick : undefined}
          playableCards={playableCards}
        />

        {/* Décorations latérales */}
        <CircularDecoration className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-30" />
        <CircularDecoration className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-30" />
      </div>
    </div>
  );
}

export function PlayerArea({
  cards,
  isPlayerTurn,
  gameStarted,
  hasHand,
  onCardClick,
  onPlayCard,
  hoveredCard,
  selectedCard,
  onCardHover,
  playableCards = [],
  className = "",
}: PlayerAreaProps) {
  return (
    <div className={`relative min-h-max py-8 text-center ${className}`}>
      <PlayerStatus
        isCurrentTurn={isPlayerTurn}
        cardCount={cards.length}
        playerName="Vos cartes"
        shortName="Vous"
        hasHand={hasHand}
        gameStarted={gameStarted}
      />

      <PlayerDeck
        cards={cards}
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

      {/* Décorations latérales */}
      <CircularDecoration
        className="absolute bottom-1/2 -left-6 translate-y-1/2 opacity-40"
        size="h-10 w-10"
        innerSize="h-8 w-8"
      />
      <CircularDecoration
        className="absolute -right-6 bottom-1/2 translate-y-1/2 opacity-40"
        size="h-10 w-10"
        innerSize="h-8 w-8"
      />
    </div>
  );
}
