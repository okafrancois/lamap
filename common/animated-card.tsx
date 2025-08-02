"use client";

import { PlayingCard, CardBack, type Card } from "./deck";
import { PlayButton } from "./play-button";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  card: Card;
  width?: number;
  height?: number;
  isOpponent?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  isFlipping?: boolean;
  isPlaying?: boolean;
  hidden?: boolean;
  onClick?: () => void;
  onPlayClick?: () => void;
  onHover?: (hovered: boolean) => void;
  className?: string;
}

export function AnimatedCard({
  card,
  width = 100,
  height = 140,
  isOpponent = false,
  isHovered = false,
  isSelected = false,
  isFlipping = false,
  isPlaying = false,
  hidden = false,
  onClick,
  onPlayClick,
  onHover,
  className,
}: AnimatedCardProps) {
  return (
    <div
      className={cn("relative transition-all duration-300", {
        "-translate-y-2 scale-105": isSelected,
        "-translate-y-4 scale-110 opacity-0": isPlaying,
        "cursor-pointer hover:scale-105": card.jouable && onClick,
        "cursor-not-allowed": !card.jouable,
      })}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{
        filter: isSelected
          ? "drop-shadow(0 8px 16px rgba(59,130,246,0.4))"
          : "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
      }}
    >
      {/* Bouton Jouer pour carte sélectionnée */}
      {!isOpponent && !hidden && (
        <PlayButton
          isVisible={isSelected && !!onPlayClick}
          onClick={() => onPlayClick?.()}
          isPlayable={card.jouable}
        />
      )}

      {/* Carte */}
      {hidden || isOpponent ? (
        <CardBack width={width} height={height} className={className} />
      ) : (
        <div>
          <PlayingCard
            suit={card.suit}
            rank={card.rank}
            width={width}
            height={height}
            className={className}
            isPlayable={card.jouable}
            isHovered={isHovered}
            isFlipping={isFlipping}
            isPlaying={isPlaying}
            onClick={onClick}
            onHover={onHover}
          />
        </div>
      )}
    </div>
  );
}
