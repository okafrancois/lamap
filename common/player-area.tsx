import { PlayerDeck } from "./deck";
import { PlayerStatus } from "./player-status";
import { CircularDecoration } from "./decorative-icons";
import type { GameState, PlayerEntity } from "@/engine/kora-game-engine";
import { useUserDataContext } from "@/components/layout/user-provider";

interface BasePlayerAreaProps {
  player: PlayerEntity;
  gameState: GameState;
  className?: string;
}

interface PlayerAreaProps extends BasePlayerAreaProps {
  onCardClick?: (cardIndex: number) => void;
  onPlayCard?: () => void;
  hoveredCard?: number | null;
  selectedCard?: number | null;
  onCardHover?: (cardIndex: number | null) => void;
}

export function PlayerArea({
  player,
  gameState,
  onCardClick,
  onPlayCard,
  hoveredCard,
  selectedCard,
  onCardHover,
  className = "",
}: PlayerAreaProps) {
  const userData = useUserDataContext();
  const isOpponent = player.username !== userData?.user.username;
  return (
    <div className={`relative min-h-max py-8 text-center ${className}`}>
      <PlayerStatus
        isCurrentTurn={gameState.playerTurnUsername === player.username}
        cardCount={player.hand?.length ?? 0}
        playerName={player.username}
        shortName={isOpponent ? "Vous" : "Adversaire"}
        hasHand={gameState.hasHandUsername === player.username}
        gameStarted={gameState.status === "playing"}
      />

      <PlayerDeck
        cards={player.hand ?? []}
        isOpponent={isOpponent}
        hidden={gameState.status !== "playing"}
        isPlayerTurn={gameState.playerTurnUsername === player.username}
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
