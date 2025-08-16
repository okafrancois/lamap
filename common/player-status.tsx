interface PlayerStatusProps {
  isCurrentTurn: boolean;
  cardCount: number;
  playerName: string;
  hasHand?: boolean;
  gameStarted?: boolean;
  className?: string;
  isOpponent?: boolean;
  gameEnded?: boolean;
  isWinner?: boolean;
  isThinking?: boolean;
  playerKoras?: number;
  isConnected?: boolean;
}

export function PlayerStatus({
  isCurrentTurn,
  cardCount,
  playerName,
  hasHand = false,
  gameStarted = false,
  className = "",
  isOpponent = false,
  gameEnded = false,
  isWinner = false,
  isThinking = false,
  playerKoras = 0,
  isConnected = true,
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
        className={`flex min-w-[200px] items-center justify-center gap-2 rounded-md px-3 py-2 transition-all duration-300 sm:gap-3 sm:rounded-lg sm:px-4 sm:py-3 ${turnColor}`}
      >
        {/* Avatar du joueur */}
        <div
          className={`flex size-8 items-center justify-center rounded-full text-white ${
            isOpponent
              ? "bg-gradient-to-br from-slate-600 to-slate-700"
              : "bg-gradient-to-br from-blue-500 to-purple-600"
          }`}
        >
          <span className="text-xs font-bold">
            {isOpponent ? "?" : playerName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Informations du joueur */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${textColor}`}>
              {playerName}
            </span>
            {!isConnected && (
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>{cardCount} cartes</span>
            {playerKoras > 0 && (
              <>
                <span>•</span>
                <span>{playerKoras} koras</span>
              </>
            )}
          </div>
        </div>

        {/* Indicateur de tour */}
        <div className={`h-3 w-3 rounded-full ${indicatorColor}`} />

        {/* Indicateur de main */}
        {gameStarted && hasHand && (
          <div className="ml-1 animate-pulse rounded-full bg-yellow-500 px-2 py-1 text-xs font-bold text-yellow-900 shadow-lg shadow-yellow-500/50">
            <span className="hidden sm:inline">👑 MAIN</span>
            <span className="sm:hidden">👑</span>
          </div>
        )}

        {/* Indicateurs de fin de partie */}
        {gameEnded && isWinner && (
          <div className="ml-1 animate-pulse rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-green-900 shadow-lg shadow-green-500/50">
            <span className="hidden sm:inline">🏆 GAGNÉ</span>
            <span className="sm:hidden">🏆</span>
          </div>
        )}

        {gameEnded && !isWinner && (
          <div className="ml-1 animate-pulse rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-red-900 shadow-lg shadow-red-500/50">
            <span className="hidden sm:inline">💀 PERDU</span>
            <span className="sm:hidden">💀</span>
          </div>
        )}
      </div>

      {/* Indicateurs de tour en haut */}
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
            Réfléchit...
          </div>
        </div>
      )}
    </div>
  );
}
