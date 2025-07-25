interface PlayerStatusProps {
  isCurrentTurn: boolean;
  cardCount: number;
  playerName: string;
  shortName?: string;
  hasHand?: boolean;
  gameStarted?: boolean;
  className?: string;
}

export function PlayerStatus({
  isCurrentTurn,
  cardCount,
  playerName,
  shortName,
  hasHand = false,
  gameStarted = false,
  className = "",
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
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all duration-300 sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 ${turnColor}`}
      >
        {/* Indicateur de tour */}
        <div className={`h-3 w-3 rounded-full ${indicatorColor}`} />

        {/* Nom et informations */}
        <span className={`text-xs font-medium sm:text-sm ${textColor}`}>
          <span className="hidden sm:inline">{playerName} </span>
          <span className="sm:hidden">{shortName ?? playerName} </span>(
          {cardCount})
          {isCurrentTurn && (
            <span className="ml-1 animate-pulse text-xs sm:ml-2">
              <span className="hidden sm:inline">🎯 À votre tour</span>
              <span className="sm:hidden">🎯</span>
            </span>
          )}
        </span>

        {/* Indicateur de main */}
        {gameStarted && hasHand && (
          <div className="ml-1 animate-pulse rounded-full bg-yellow-500 px-1 py-0.5 text-xs font-bold text-yellow-900 shadow-lg shadow-yellow-500/50 sm:ml-2 sm:px-2 sm:py-1">
            <span className="hidden sm:inline">👑 LA MAIN</span>
            <span className="sm:hidden">👑</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface OpponentStatusProps
  extends Omit<
    PlayerStatusProps,
    "isCurrentTurn" | "playerName" | "shortName"
  > {
  isOpponentTurn: boolean;
}

export function OpponentStatus({
  isOpponentTurn,
  cardCount,
  hasHand = false,
  gameStarted = false,
  className = "",
}: OpponentStatusProps) {
  const turnColor = isOpponentTurn
    ? "border-red-500/30 bg-gradient-to-r from-red-500/20 to-red-600/20 shadow-lg"
    : "border-gray-500/20 bg-gray-500/10";

  const indicatorColor = isOpponentTurn
    ? "animate-pulse bg-red-500 shadow-lg shadow-red-500/50"
    : "bg-gray-400";

  const textColor = isOpponentTurn ? "text-red-200" : "text-amber-200/80";

  return (
    <div className={`mb-2 flex items-center justify-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all duration-300 sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 ${turnColor}`}
      >
        {/* Indicateur de tour */}
        <div className={`h-3 w-3 rounded-full ${indicatorColor}`} />

        {/* Nom et informations */}
        <span className={`text-xs font-medium sm:text-sm ${textColor}`}>
          <span className="hidden sm:inline">Adversaire </span>
          <span className="sm:hidden">IA </span>({cardCount})
          {isOpponentTurn && (
            <span className="ml-1 animate-pulse text-xs sm:ml-2">
              <span className="hidden sm:inline">🎯 À son tour</span>
              <span className="sm:hidden">🎯</span>
            </span>
          )}
        </span>

        {/* Indicateur de main */}
        {gameStarted && hasHand && (
          <div className="ml-1 animate-pulse rounded-full bg-yellow-500 px-1 py-0.5 text-xs font-bold text-yellow-900 shadow-lg shadow-yellow-500/50 sm:ml-2 sm:px-2 sm:py-1">
            <span className="hidden sm:inline">👑 LA MAIN</span>
            <span className="sm:hidden">👑</span>
          </div>
        )}
      </div>
    </div>
  );
}
