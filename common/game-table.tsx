import { PlayedCards } from "./deck";
import {
  GameTablePattern,
  AnimatedRing,
  DecorativeBorder,
} from "./decorative-icons";
import type { PlayedCard } from "@/engine/kora-game-engine";

interface GameTableProps {
  playedCards: PlayedCard[];
  currentUserId?: string;
  className?: string;
}

export function GameTable({
  playedCards,
  currentUserId,
  className = "",
}: GameTableProps) {
  return (
    <div
      className={`relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4 ${className}`}
    >
      {/* Anneaux décoratifs animés */}
      <AnimatedRing size="h-[45%] w-[45%]" duration="4s" delay="0s" />
      <AnimatedRing
        size="h-[50%] w-[50%]"
        duration="6s"
        delay="1s"
        className="border-amber-300/15"
      />
      <AnimatedRing
        size="h-[55%] w-[55%]"
        duration="8s"
        delay="2s"
        className="border-amber-200/10"
      />

      <div className="relative aspect-[6/4] max-h-[500px] w-auto max-w-[500px] min-w-[300px] lg:min-w-[400px]">
        {/* Plateau de jeu principal */}
        <div className="relative h-full w-full rounded-2xl border-4 border-amber-400/80 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 shadow-2xl">
          {/* Effet de profondeur */}
          <div className="absolute inset-2 rounded-xl border-2 border-amber-300/30 bg-gradient-to-br from-emerald-600/20 to-emerald-900/40" />

          {/* Décorations aux coins */}
          <TableCornerDecorations />

          {/* Motifs de guidage */}
          <GameTablePattern />

          {/* Effet de brillance */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent" />

          {/* Zone des cartes au centre */}
          <div className="flex h-full items-center justify-center">
            <PlayedCards cards={playedCards} currentUserId={currentUserId} />
          </div>

          {/* Texture de feutre */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-30">
            <div className="h-full w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-900/20" />
          </div>
        </div>
      </div>

      {/* Éléments décoratifs latéraux */}
      <DecorativeBorder
        className="absolute top-1/2 left-4 -translate-y-1/2 opacity-40"
        orientation="vertical"
      />
      <DecorativeBorder
        className="absolute top-1/2 right-4 -translate-y-1/2 opacity-40"
        orientation="vertical"
      />
    </div>
  );
}

function TableCornerDecorations() {
  const cornerPositions = [
    "top-3 left-3",
    "top-3 right-3",
    "bottom-3 left-3",
    "bottom-3 right-3",
  ];

  return (
    <>
      {cornerPositions.map((position, index) => (
        <div key={index} className={`absolute ${position}`}>
          <div className="h-6 w-6 rounded-full border-2 border-amber-300/60 bg-amber-200/20">
            <div className="m-1 h-4 w-4 rounded-full bg-amber-300/40" />
          </div>
        </div>
      ))}
    </>
  );
}
