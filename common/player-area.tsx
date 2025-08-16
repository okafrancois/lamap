import { PlayerDeck } from "./deck";
import { PlayerStatus } from "./player-status";
import { CircularDecoration } from "./decorative-icons";
import type { Game, PlayerEntity } from "@/engine/kora-game-engine";
import { useUserDataContext } from "@/components/layout/user-provider";
import { GameStatus } from "@prisma/client";

interface BasePlayerAreaProps {
  player: PlayerEntity | null | undefined;
  gameState: Game | null | undefined;
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

  if (!gameState || !player) {
    return (
      <div className={`relative min-h-max py-8 text-center ${className}`}>
        <PlayerStatus
          isCurrentTurn={false}
          cardCount={0}
          playerName={"..."}
          hasHand={false}
          gameStarted={false}
          gameEnded={false}
          isWinner={false}
          isThinking={false}
          isOpponent={false}
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

  const isOpponent = player.username !== userData?.user.username;
  return (
    <div className={`relative min-h-max py-8 text-center ${className}`}>
      <PlayerStatus
        isCurrentTurn={gameState.playerTurnUsername === player.username}
        cardCount={player.hand?.length ?? 0}
        playerName={player.username}
        hasHand={gameState.hasHandUsername === player.username}
        gameStarted={gameState.status === GameStatus.PLAYING}
        gameEnded={gameState.status === GameStatus.ENDED}
        isWinner={gameState.winnerUsername === player.username}
        isThinking={player.isThinking}
        isOpponent={isOpponent}
        playerKoras={player.koras}
        isConnected={player.isConnected}
      />

      <PlayerDeck
        cards={player.hand ?? []}
        isOpponent={isOpponent}
        hidden={gameState.status !== GameStatus.PLAYING}
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
