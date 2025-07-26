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

  // Callbacks multijoueur (optionnels)
  onPlayerJoin,
  onPlayerLeave,
  onGameStateSync,
  onConnectionChange,
}: GameBoardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        className,
      )}
    >
      {/* Éléments décoratifs d'arrière-plan */}
      <div className="pointer-events-none absolute inset-0">
        {/* Motifs de bordure élégants */}
        <div className="absolute top-0 left-0 h-32 w-32 opacity-20">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M20,20 Q50,5 80,20 Q95,50 80,80 Q50,95 20,80 Q5,50 20,20 Z"
              fill="none"
              stroke="rgba(251, 191, 36, 0.6)"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="8" fill="rgba(251, 191, 36, 0.3)" />
          </svg>
        </div>
        <div className="absolute top-0 right-0 h-32 w-32 rotate-90 opacity-20">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M20,20 Q50,5 80,20 Q95,50 80,80 Q50,95 20,80 Q5,50 20,20 Z"
              fill="none"
              stroke="rgba(251, 191, 36, 0.6)"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="8" fill="rgba(251, 191, 36, 0.3)" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 h-32 w-32 -rotate-90 opacity-20">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M20,20 Q50,5 80,20 Q95,50 80,80 Q50,95 20,80 Q5,50 20,20 Z"
              fill="none"
              stroke="rgba(251, 191, 36, 0.6)"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="8" fill="rgba(251, 191, 36, 0.3)" />
          </svg>
        </div>
        <div className="absolute right-0 bottom-0 h-32 w-32 rotate-180 opacity-20">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M20,20 Q50,5 80,20 Q95,50 80,80 Q50,95 20,80 Q5,50 20,20 Z"
              fill="none"
              stroke="rgba(251, 191, 36, 0.6)"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="8" fill="rgba(251, 191, 36, 0.3)" />
          </svg>
        </div>

        {/* Particules flottantes */}
        <div className="absolute top-1/4 left-1/4 h-2 w-2 animate-pulse rounded-full bg-amber-400/40"></div>
        <div
          className="absolute top-1/3 right-1/4 h-1 w-1 animate-pulse rounded-full bg-amber-300/30"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500/50"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute right-1/3 bottom-1/3 h-1 w-1 animate-pulse rounded-full bg-amber-200/40"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Bordures latérales décoratives */}
        <div className="absolute top-1/2 left-2 h-24 w-1 -translate-y-1/2 bg-gradient-to-b from-transparent via-amber-400/30 to-transparent"></div>
        <div className="absolute top-1/2 right-2 h-24 w-1 -translate-y-1/2 bg-gradient-to-b from-transparent via-amber-400/30 to-transparent"></div>
        <div className="absolute top-2 left-1/2 h-1 w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>
        <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>
      </div>

      {/* Cartes de l'adversaire (en haut) */}
      <div className="relative z-10 p-4">
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div
              className={`text-sm ${currentTurn === "opponent" ? "text-amber-300" : "text-amber-200/80"}`}
            >
              Adversaire ({opponentCards.length} cartes){" "}
              {currentTurn === "opponent" && "- À son tour"}
            </div>
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
            cards={opponentCards}
            isOpponent={true}
            revealOpponentCards={godMode}
            onCardClick={godMode ? onOpponentCardClick : undefined}
            playableCards={playableCards}
          />

          {/* Éléments décoratifs autour des cartes adversaires */}
          <div className="absolute top-1/2 -left-4 h-8 w-8 -translate-y-1/2 opacity-30">
            <div className="h-full w-full rounded-full border-2 border-amber-400/40 bg-amber-200/10">
              <div className="m-1 h-6 w-6 rounded-full bg-amber-300/30"></div>
            </div>
          </div>
          <div className="absolute top-1/2 -right-4 h-8 w-8 -translate-y-1/2 opacity-30">
            <div className="h-full w-full rounded-full border-2 border-amber-400/40 bg-amber-200/10">
              <div className="m-1 h-6 w-6 rounded-full bg-amber-300/30"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de cartes jouées (au milieu) */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        {/* Anneaux décoratifs autour du plateau */}
        <div
          className="absolute h-[45%] w-[45%] animate-pulse rounded-full border border-amber-400/20"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute h-[50%] w-[50%] animate-pulse rounded-full border border-amber-300/15"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute h-[55%] w-[55%] animate-pulse rounded-full border border-amber-200/10"
          style={{ animationDuration: "8s", animationDelay: "2s" }}
        ></div>

        <div className="relative aspect-square w-[35%]">
          {/* Plateau de jeu avec design élaboré */}
          <div className="relative h-full w-full rounded-2xl border-4 border-amber-400/80 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 shadow-2xl">
            {/* Effet de profondeur avec ombres intérieures */}
            <div className="absolute inset-2 rounded-xl border-2 border-amber-300/30 bg-gradient-to-br from-emerald-600/20 to-emerald-900/40"></div>

            {/* Motifs décoratifs aux coins */}
            <div className="absolute top-3 left-3">
              <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
              </div>
            </div>
            <div className="absolute bottom-3 left-3">
              <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
              </div>
            </div>
            <div className="absolute right-3 bottom-3">
              <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
                <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40"></div>
              </div>
            </div>

            {/* Lignes de guidage décoratives */}
            <div className="absolute inset-0 rounded-2xl">
              <svg className="h-full w-full" viewBox="0 0 200 200">
                {/* Croix centrale */}
                <line
                  x1="100"
                  y1="40"
                  x2="100"
                  y2="160"
                  stroke="rgba(251, 191, 36, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <line
                  x1="40"
                  y1="100"
                  x2="160"
                  y2="100"
                  stroke="rgba(251, 191, 36, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />

                {/* Cercle central */}
                <circle
                  cx="100"
                  cy="100"
                  r="25"
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />

                {/* Motifs en losange */}
                <path
                  d="M70,70 L100,50 L130,70 L100,90 Z"
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.15)"
                  strokeWidth="1"
                />
                <path
                  d="M70,130 L100,110 L130,130 L100,150 Z"
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.15)"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* Effet de brillance */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent"></div>

            {/* Zone des cartes au centre */}
            <div className="flex h-full items-center justify-center p-6">
              <PlayedCards cards={playedCards} />
            </div>

            {/* Texture de feutre */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-30">
              <div className="h-full w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-900/20"></div>
            </div>
          </div>

          {/* Ombre portée du plateau */}
          <div className="absolute -right-4 -bottom-4 h-full w-full rounded-2xl bg-black/20 blur-xl"></div>
        </div>

        {/* Éléments décoratifs latéraux */}
        <div className="absolute top-1/2 left-4 h-16 w-4 -translate-y-1/2 opacity-40">
          <div className="h-full w-full rounded-full bg-gradient-to-b from-amber-400/30 via-amber-300/20 to-amber-400/30"></div>
        </div>
        <div className="absolute top-1/2 right-4 h-16 w-4 -translate-y-1/2 opacity-40">
          <div className="h-full w-full rounded-full bg-gradient-to-b from-amber-400/30 via-amber-300/20 to-amber-400/30"></div>
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

        {/* Éléments décoratifs autour des cartes du joueur */}
        <div className="absolute bottom-1/2 -left-6 h-10 w-10 translate-y-1/2 opacity-40">
          <div className="h-full w-full rounded-full border-2 border-amber-400/50 bg-amber-200/15">
            <div className="m-1 h-8 w-8 rounded-full bg-amber-300/40"></div>
          </div>
        </div>
        <div className="absolute -right-6 bottom-1/2 h-10 w-10 translate-y-1/2 opacity-40">
          <div className="h-full w-full rounded-full border-2 border-amber-400/50 bg-amber-200/15">
            <div className="m-1 h-8 w-8 rounded-full bg-amber-300/40"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
