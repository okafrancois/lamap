interface PlayerStatusProps {
  isCurrentTurn: boolean;
  cardCount: number;
  playerName: string;
  shortName?: string;
  hasHand?: boolean;
  gameStarted?: boolean;
  className?: string;
  isOpponent?: boolean;
  gameEnded?: boolean;
  isWinner?: boolean;
  isThinking?: boolean;
}

export function PlayerStatus({
  isCurrentTurn,
  cardCount,
  playerName,
  shortName,
  hasHand = false,
  gameStarted = false,
  className = "",
  isOpponent = false,
  gameEnded = false,
  isWinner = false,
  isThinking = false,
}: PlayerStatusProps) {
  const turnColor = isCurrentTurn
    ? "border-green-500/30 bg-gradient-to-r from-green-500/20 to-green-600/20 shadow-lg"
    : "border-gray-500/20 bg-gray-500/10";

  const indicatorColor = isCurrentTurn
    ? "animate-pulse bg-green-500 shadow-lg shadow-green-500/50"
    : "bg-gray-400";

  const textColor = isCurrentTurn ? "text-green-200" : "text-amber-100/60";

  return (
    <div className={`mb-1 flex justify-center sm:mb-2 ${className}`}>
      <div
        className={`flex min-w-[180px] items-center justify-center gap-1 rounded-md px-2 py-1 transition-all duration-300 sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 ${turnColor}`}
      >
        {/* Indicateur de tour */}
        <div className={`h-3 w-3 rounded-full ${indicatorColor}`} />

        {/* Nom et informations */}
        <span className={`text-xs font-medium sm:text-sm ${textColor}`}>
          <span className="hidden sm:inline">{playerName} </span>
          <span className="sm:hidden">{shortName ?? playerName} </span>(
          {cardCount})
        </span>

        {/* Indicateur de main */}
        {gameStarted && hasHand && (
          <div className="ml-1 animate-pulse rounded-full bg-yellow-500 px-1 py-0.5 text-xs font-bold text-yellow-900 shadow-lg shadow-yellow-500/50 sm:ml-2 sm:px-2 sm:py-1">
            <span className="hidden sm:inline">👑 LA MAIN</span>
            <span className="sm:hidden">👑</span>
          </div>
        )}

        {gameEnded && isWinner && !isOpponent && (
          <div className="ml-1 animate-pulse rounded-full bg-green-500 px-1 py-0.5 text-xs font-bold text-green-900 shadow-lg shadow-green-500/50 sm:ml-2 sm:px-2 sm:py-1">
            <span className="hidden sm:inline">🏆 gagné</span>
            <span className="sm:hidden">🏆</span>
          </div>
        )}

        {gameEnded && !isWinner && !isOpponent && (
          <div className="ml-1 animate-pulse rounded-full bg-red-500 px-1 py-0.5 text-xs font-bold text-red-900 shadow-lg shadow-red-500/50 sm:ml-2 sm:px-2 sm:py-1">
            <span className="hidden sm:inline">🏆 perdu</span>
            <span className="sm:hidden">🏆</span>
          </div>
        )}

        {!isOpponent && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 transform animate-pulse">
            {isCurrentTurn ? (
              <div className="rounded-full bg-green-500 px-3 py-1 text-sm font-semibold text-white">
                Votre tour
              </div>
            ) : (
              <div className="rounded-full bg-slate-600 px-3 py-1 text-sm text-white/70">
                Tour de l&apos;adversaire
              </div>
            )}
          </div>
        )}

        {isOpponent && isThinking && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 transform">
            <div className="rounded-full bg-slate-600 px-3 py-1 text-sm text-white/70">
              Réfléchi...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
