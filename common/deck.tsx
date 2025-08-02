"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  IconClubsFilled,
  IconDiamondsFilled,
  IconHeartFilled,
  IconSpadeFilled,
} from "@tabler/icons-react";
import { AnimatedCard } from "./animated-card";
import type { PlayedCard } from "@/engine/kora-game-engine";
import { useUserDataContext } from "@/components/layout/user-provider";
import { useSound } from "@/hooks/use-sound";

// Types de cartes
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type Card = {
  suit: Suit;
  rank: Rank;
  jouable: boolean;
  id: string;
};

interface CardProps {
  suit: Suit;
  rank: Rank;
  width?: number;
  height?: number;
  className?: string;
  isPlayable?: boolean;
  isFlipping?: boolean;
  isPlaying?: boolean;
  isHovered?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  onHover?: (hovered: boolean) => void;
}

// Composant pour une carte individuelle
const PlayingCard: React.FC<CardProps> = ({
  suit,
  rank,
  width = 100,
  height = 140,
  className,
  isPlayable = true,
  isFlipping = false,
  isPlaying = false,
  isHovered = false,
  onClick,
  onHover,
}) => {
  const isRed = suit === "hearts" || suit === "diamonds";

  // Symboles des suites
  const suitSymbols: Record<Suit, React.ElementType> = {
    hearts: IconHeartFilled,
    diamonds: IconDiamondsFilled,
    clubs: IconClubsFilled,
    spades: IconSpadeFilled,
  };

  // Fonction pour rendre une icône de suite comme élément SVG
  const renderSuitIcon = (suit: Suit, x: number, y: number, size = 12) => {
    const SuitIcon = suitSymbols[suit];
    return (
      <foreignObject
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
      >
        <SuitIcon
          size={size}
          className={cn(
            "text-primary",
            isRed ? "text-primary" : "text-foreground",
          )}
        />
      </foreignObject>
    );
  };

  // Dessins complexes pour les figures
  const renderFaceCard = () => {
    if (rank === "J" || rank === "Q" || rank === "K") {
      return (
        <g transform="translate(50, 70)">
          {/* Fond décoratif avec pattern */}
          <rect
            x="-35"
            y="-50"
            width="70"
            height="100"
            className={cn(
              "fill-current opacity-10",
              isRed ? "text-primary" : "text-foreground",
            )}
            rx="5"
          />

          {/* Cadre ornementé */}
          <rect
            x="-32"
            y="-47"
            width="64"
            height="94"
            fill="none"
            className={cn(
              "stroke-current opacity-20",
              isRed ? "text-primary" : "text-foreground",
            )}
            strokeWidth="1.5"
            rx="3"
          />

          {/* Motifs décoratifs élaborés */}
          <g className="opacity-30">
            {/* Lignes horizontales décoratives */}
            <path
              d="M-30,-45 L30,-45 M-30,-40 L30,-40 M-30,40 L30,40 M-30,45 L30,45"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-foreground",
              )}
              strokeWidth="1"
              fill="none"
            />

            {/* Cercles ornementaux */}
            <circle
              cx="-25"
              cy="0"
              r="15"
              fill="none"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-foreground",
              )}
              strokeWidth="1"
            />
            <circle
              cx="25"
              cy="0"
              r="15"
              fill="none"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-foreground",
              )}
              strokeWidth="1"
            />

            {/* Motifs en losange */}
            <path
              d="M0,-35 L10,-25 L0,-15 L-10,-25 Z M0,15 L10,25 L0,35 L-10,25 Z"
              fill="none"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-foreground",
              )}
              strokeWidth="0.5"
            />
          </g>

          {/* Figure stylisée */}
          {rank === "K" && (
            <g>
              {/* Couronne du roi */}
              <path
                d="M-15,-25 L-10,-20 L-5,-25 L0,-20 L5,-25 L10,-20 L15,-25 L15,-15 L-15,-15 Z"
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />
              <circle
                cx="-10"
                cy="-25"
                r="2"
                className={cn(
                  "fill-current",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />
              <circle
                cx="0"
                cy="-25"
                r="2"
                className={cn(
                  "fill-current",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />
              <circle
                cx="10"
                cy="-25"
                r="2"
                className={cn(
                  "fill-current",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />

              {/* Visage stylisé */}
              <circle
                cx="0"
                cy="-5"
                r="8"
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />

              {/* Corps avec détails royaux */}
              <path
                d="M-20,5 L-15,0 L-10,5 L-10,35 L10,35 L10,5 L15,0 L20,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-foreground",
                )}
                strokeWidth="1.5"
              />

              {/* Symbole du pouvoir */}
              <circle
                cx="0"
                cy="20"
                r="5"
                fill="none"
                className={cn(
                  "stroke-current opacity-30",
                  isRed ? "text-primary" : "text-foreground",
                )}
                strokeWidth="1"
              />
              {renderSuitIcon(suit, 0, 20, 8)}

              <text
                x="0"
                y="50"
                textAnchor="middle"
                fontSize="24"
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-foreground",
                )}
              >
                K
              </text>
            </g>
          )}

          {rank === "Q" && (
            <g>
              {/* Coiffe de la reine */}
              <path
                d="M-12,-22 Q0,-28 12,-22 L12,-15 Q0,-20 -12,-15 Z"
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />
              <circle
                cx="0"
                cy="-25"
                r="3"
                className={cn(
                  "fill-current opacity-50",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />

              {/* Visage avec élégance */}
              <circle
                cx="0"
                cy="-5"
                r="8"
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />

              {/* Robe élaborée */}
              <path
                d="M-15,5 Q-10,0 -5,5 L-8,35 L8,35 L5,5 Q10,0 15,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-foreground",
                )}
                strokeWidth="1.5"
              />

              {/* Collier */}
              <ellipse
                cx="0"
                cy="10"
                rx="8"
                ry="3"
                fill="none"
                className={cn(
                  "stroke-current opacity-30",
                  isRed ? "text-primary" : "text-foreground",
                )}
                strokeWidth="1"
              />

              {/* Fleur décorative */}
              <g transform="translate(0, 20)">
                <circle
                  cx="0"
                  cy="0"
                  r="2"
                  className={cn(
                    "fill-current opacity-20",
                    isRed ? "text-primary" : "text-foreground",
                  )}
                />
                <circle
                  cx="-4"
                  cy="-2"
                  r="2"
                  className={cn(
                    "fill-current opacity-15",
                    isRed ? "text-primary" : "text-foreground",
                  )}
                />
                <circle
                  cx="4"
                  cy="-2"
                  r="2"
                  className={cn(
                    "fill-current opacity-15",
                    isRed ? "text-primary" : "text-foreground",
                  )}
                />
                <circle
                  cx="-4"
                  cy="2"
                  r="2"
                  className={cn(
                    "fill-current opacity-15",
                    isRed ? "text-primary" : "text-foreground",
                  )}
                />
                <circle
                  cx="4"
                  cy="2"
                  r="2"
                  className={cn(
                    "fill-current opacity-15",
                    isRed ? "text-primary" : "text-foreground",
                  )}
                />
              </g>

              <text
                x="0"
                y="50"
                textAnchor="middle"
                fontSize="24"
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-foreground",
                )}
              >
                Q
              </text>
            </g>
          )}

          {rank === "J" && (
            <g>
              {/* Chapeau du valet */}
              <path
                d="M-10,-20 L-8,-25 Q0,-28 8,-25 L10,-20 L5,-15 L-5,-15 Z"
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />
              <circle
                cx="7"
                cy="-22"
                r="2"
                className={cn(
                  "fill-current opacity-40",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />

              {/* Visage jeune */}
              <circle
                cx="0"
                cy="-5"
                r="8"
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />

              {/* Tunique avec détails */}
              <path
                d="M-12,5 L-10,0 L-8,5 L-10,35 L10,35 L8,5 L10,0 L12,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-foreground",
                )}
                strokeWidth="1.5"
              />

              {/* Ceinture */}
              <rect
                x="-10"
                y="15"
                width="20"
                height="3"
                className={cn(
                  "fill-current opacity-20",
                  isRed ? "text-primary" : "text-foreground",
                )}
              />

              {/* Épée stylisée */}
              <g transform="translate(15, 10) rotate(45)">
                <rect
                  x="-1"
                  y="0"
                  width="2"
                  height="15"
                  className={cn(
                    "fill-current opacity-30",
                    isRed ? "text-primary" : "text-foreground",
                  )}
                />
                <rect
                  x="-3"
                  y="-2"
                  width="6"
                  height="3"
                  className={cn(
                    "fill-current opacity-40",
                    isRed ? "text-primary" : "text-foreground",
                  )}
                />
              </g>

              <text
                x="0"
                y="50"
                textAnchor="middle"
                fontSize="24"
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-foreground",
                )}
              >
                J
              </text>
            </g>
          )}
        </g>
      );
    }
    return null;
  };

  // Disposition des symboles pour les cartes numériques
  const renderPips = () => {
    const positions: Record<string, Array<{ x: number; y: number }>> = {
      A: [{ x: 50, y: 70 }],
      "2": [
        { x: 50, y: 30 },
        { x: 50, y: 110 },
      ],
      "3": [
        { x: 50, y: 30 },
        { x: 50, y: 70 },
        { x: 50, y: 110 },
      ],
      "4": [
        { x: 30, y: 30 },
        { x: 70, y: 30 },
        { x: 30, y: 110 },
        { x: 70, y: 110 },
      ],
      "5": [
        { x: 30, y: 30 },
        { x: 70, y: 30 },
        { x: 50, y: 70 },
        { x: 30, y: 110 },
        { x: 70, y: 110 },
      ],
      "6": [
        { x: 30, y: 30 },
        { x: 70, y: 30 },
        { x: 30, y: 70 },
        { x: 70, y: 70 },
        { x: 30, y: 110 },
        { x: 70, y: 110 },
      ],
      "7": [
        { x: 30, y: 30 },
        { x: 70, y: 30 },
        { x: 50, y: 50 },
        { x: 30, y: 70 },
        { x: 70, y: 70 },
        { x: 30, y: 110 },
        { x: 70, y: 110 },
      ],
      "8": [
        { x: 30, y: 30 },
        { x: 70, y: 30 },
        { x: 50, y: 50 },
        { x: 30, y: 70 },
        { x: 70, y: 70 },
        { x: 50, y: 90 },
        { x: 30, y: 110 },
        { x: 70, y: 110 },
      ],
      "9": [
        { x: 30, y: 25 },
        { x: 70, y: 25 },
        { x: 30, y: 50 },
        { x: 70, y: 50 },
        { x: 50, y: 70 },
        { x: 30, y: 90 },
        { x: 70, y: 90 },
        { x: 30, y: 115 },
        { x: 70, y: 115 },
      ],
      "10": [
        { x: 30, y: 25 },
        { x: 70, y: 25 },
        { x: 50, y: 40 },
        { x: 30, y: 55 },
        { x: 70, y: 55 },
        { x: 30, y: 85 },
        { x: 70, y: 85 },
        { x: 50, y: 100 },
        { x: 30, y: 115 },
        { x: 70, y: 115 },
      ],
    };

    const pips = positions[rank] ?? [];

    return pips.map((pos, index) => (
      <g key={index}>
        {renderSuitIcon(suit, pos.x, pos.y, rank === "A" ? 24 : 12)}
      </g>
    ));
  };

  return (
    <div
      className={cn("playing-card relative", className)}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 140"
        className="h-full w-full"
      >
        {/* Fond de carte avec texture et patterns améliorés */}
        <defs>
          {/* Pattern de texture raffinée */}
          <pattern
            id={`cardTexture-${suit}-${rank}`}
            x="0"
            y="0"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="rgba(255,255,255,1)" />
            <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,1)" />
            <circle cx="6" cy="6" r="0.5" fill="rgba(255,255,255,1)" />
            <rect
              x="1"
              y="1"
              width="6"
              height="6"
              fill="rgba(255,255,255,1)"
              rx="1"
            />
          </pattern>

          {/* Gradient premium pour profondeur */}
          <linearGradient
            id={`cardGradient-${suit}-${rank}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="20%" stopColor="rgba(248,250,252,1)" />
            <stop offset="80%" stopColor="rgba(241,245,249,1)" />
            <stop offset="100%" stopColor="rgba(226,232,240,1)" />
          </linearGradient>

          {/* Pattern décoratif élégant pour les bordures */}
          <pattern
            id={`borderPattern-${suit}-${rank}`}
            x="0"
            y="0"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <rect width="12" height="12" fill="none" />
            <path
              d="M2,2 L10,2 L10,10 L2,10 Z"
              fill="none"
              stroke={isRed ? "rgba(239,68,68,0.1)" : "rgba(15,23,42,0.1)"}
              strokeWidth="0.5"
            />
            <circle
              cx="6"
              cy="6"
              r="1.5"
              fill={isRed ? "rgba(239,68,68,0.05)" : "rgba(15,23,42,0.05)"}
            />
          </pattern>

          {/* Ombre portée premium */}
          <filter
            id={`cardShadow-${suit}-${rank}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="8"
              floodColor="#000000"
              floodOpacity="0.25"
            />
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="2"
              floodColor="#000000"
              floodOpacity="0.1"
            />
          </filter>

          {/* Effet de brillance */}
          <linearGradient
            id={`shine-${suit}-${rank}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>

          {/* Bordure dorée pour les figures */}
          {(rank === "J" || rank === "Q" || rank === "K") && (
            <linearGradient
              id={`goldBorder-${suit}-${rank}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(251,191,36,0.8)" />
              <stop offset="50%" stopColor="rgba(245,158,11,0.6)" />
              <stop offset="100%" stopColor="rgba(217,119,6,0.4)" />
            </linearGradient>
          )}
        </defs>

        {/* Carte principale avec gradient premium */}
        <rect
          x="0"
          y="0"
          width="100"
          height="140"
          rx="10"
          fill={`url(#cardGradient-${suit}-${rank})`}
          stroke={
            rank === "J" || rank === "Q" || rank === "K"
              ? `url(#goldBorder-${suit}-${rank})`
              : "rgba(203,213,225,0.8)"
          }
          strokeWidth={rank === "J" || rank === "Q" || rank === "K" ? "2" : "1"}
          filter={`url(#cardShadow-${suit}-${rank})`}
        />

        {/* Bordure décorative premium */}
        <rect
          x="3"
          y="3"
          width="94"
          height="134"
          rx="8"
          fill="none"
          stroke={isRed ? "rgba(239,68,68,0.15)" : "rgba(15,23,42,0.15)"}
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Pattern de texture subtil */}
        <rect
          x="2"
          y="2"
          width="96"
          height="136"
          rx="9"
          fill={`url(#borderPattern-${suit}-${rank})`}
          opacity="0.6"
        />

        {/* Effet de brillance pour les figures */}
        {(rank === "J" || rank === "Q" || rank === "K") && (
          <rect
            x="1"
            y="1"
            width="98"
            height="138"
            rx="9"
            fill={`url(#shine-${suit}-${rank})`}
            opacity="0.3"
          />
        )}

        {/* Motifs décoratifs élégants aux coins */}
        <g className="opacity-20">
          {/* Coin supérieur gauche */}
          <g>
            <path
              d="M8,8 Q15,8 15,15 L15,20 Q12,17 8,17 Z"
              fill={isRed ? "rgba(239,68,68,0.3)" : "rgba(15,23,42,0.3)"}
            />
            <circle
              cx="12"
              cy="12"
              r="2"
              fill={isRed ? "rgba(239,68,68,0.5)" : "rgba(15,23,42,0.5)"}
            />
          </g>

          {/* Coin supérieur droit */}
          <g>
            <path
              d="M92,8 Q85,8 85,15 L85,20 Q88,17 92,17 Z"
              fill={isRed ? "rgba(239,68,68,0.3)" : "rgba(15,23,42,0.3)"}
            />
            <circle
              cx="88"
              cy="12"
              r="2"
              fill={isRed ? "rgba(239,68,68,0.5)" : "rgba(15,23,42,0.5)"}
            />
          </g>

          {/* Coin inférieur gauche */}
          <g>
            <path
              d="M8,132 Q15,132 15,125 L15,120 Q12,123 8,123 Z"
              fill={isRed ? "rgba(239,68,68,0.3)" : "rgba(15,23,42,0.3)"}
            />
            <circle
              cx="12"
              cy="128"
              r="2"
              fill={isRed ? "rgba(239,68,68,0.5)" : "rgba(15,23,42,0.5)"}
            />
          </g>

          {/* Coin inférieur droit */}
          <g>
            <path
              d="M92,132 Q85,132 85,125 L85,120 Q88,123 92,123 Z"
              fill={isRed ? "rgba(239,68,68,0.3)" : "rgba(15,23,42,0.3)"}
            />
            <circle
              cx="88"
              cy="128"
              r="2"
              fill={isRed ? "rgba(239,68,68,0.5)" : "rgba(15,23,42,0.5)"}
            />
          </g>
        </g>

        {/* Coins avec indices premium */}
        <g>
          {/* Coin supérieur gauche avec design raffiné */}
          <g>
            <rect
              x="4"
              y="8"
              width="22"
              height="30"
              rx="4"
              fill="rgba(255,255,255,0.8)"
              stroke={isRed ? "rgba(239,68,68,0.2)" : "rgba(15,23,42,0.2)"}
              strokeWidth="1"
            />
            <rect
              x="6"
              y="10"
              width="18"
              height="26"
              rx="3"
              fill={isRed ? "rgba(239,68,68,0.05)" : "rgba(15,23,42,0.05)"}
            />
            <text
              x="12"
              y="22"
              fontSize="14"
              fontWeight="bold"
              fill={isRed ? "#dc2626" : "#1e293b"}
              textAnchor="start"
            >
              {rank}
            </text>
            {renderSuitIcon(suit, 12, 30, 8)}
          </g>

          {/* Coin inférieur droit (inversé) avec design raffiné */}
          <g transform="rotate(180, 50, 70)">
            <rect
              x="4"
              y="8"
              width="22"
              height="30"
              rx="4"
              fill="rgba(255,255,255,0.8)"
              stroke={isRed ? "rgba(239,68,68,0.2)" : "rgba(15,23,42,0.2)"}
              strokeWidth="1"
            />
            <rect
              x="6"
              y="10"
              width="18"
              height="26"
              rx="3"
              fill={isRed ? "rgba(239,68,68,0.05)" : "rgba(15,23,42,0.05)"}
            />
            <text
              x="12"
              y="22"
              fontSize="14"
              fontWeight="bold"
              fill={isRed ? "#dc2626" : "#1e293b"}
              textAnchor="start"
            >
              {rank}
            </text>
            {renderSuitIcon(suit, 12, 30, 8)}
          </g>
        </g>

        {/* Contenu central */}
        {rank === "J" || rank === "Q" || rank === "K"
          ? renderFaceCard()
          : renderPips()}
      </svg>
    </div>
  );
};

// Composant pour le dos de carte
const CardBack: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 100, height = 140, className }) => {
  return (
    <div className={cn("playing-card", className)}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 140"
        className="h-full w-full"
      >
        <defs>
          {/* Pattern répétitif pour le fond */}
          <pattern
            id="cardBackPattern"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="20" height="20" className="fill-primary" />
            <circle cx="10" cy="10" r="8" className="fill-primary/90" />
            <circle cx="10" cy="10" r="6" className="fill-primary/80" />
            <circle cx="10" cy="10" r="4" className="fill-secondary/20" />
            <rect
              x="9"
              y="2"
              width="2"
              height="16"
              className="fill-secondary/30"
            />
            <rect
              x="2"
              y="9"
              width="16"
              height="2"
              className="fill-secondary/30"
            />
          </pattern>

          {/* Gradient pour bordure */}
          <linearGradient
            id="backBorderGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              className="text-secondary"
              stopColor="currentColor"
            />
            <stop
              offset="50%"
              className="text-secondary/80"
              stopColor="currentColor"
            />
            <stop
              offset="100%"
              className="text-secondary"
              stopColor="currentColor"
            />
          </linearGradient>
        </defs>

        {/* Bordure extérieure */}
        <rect
          x="0"
          y="0"
          width="100"
          height="140"
          rx="8"
          fill="url(#backBorderGradient)"
        />

        {/* Fond avec pattern */}
        <rect
          x="4"
          y="4"
          width="92"
          height="132"
          rx="6"
          fill="url(#cardBackPattern)"
        />

        {/* Cadre intérieur décoratif */}
        <rect
          x="8"
          y="8"
          width="84"
          height="124"
          rx="5"
          fill="none"
          className="stroke-secondary/50"
          strokeWidth="1"
          strokeDasharray="2 1"
        />

        {/* Motif central élaboré */}
        <g transform="translate(50, 70)">
          {/* Étoile à 8 branches */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path
                d="M0,0 L0,-30 L2,-25 L0,-20 L-2,-25 Z"
                className="fill-secondary/60"
              />
            </g>
          ))}

          {/* Cercles concentriques */}
          <circle
            r="30"
            fill="none"
            className="stroke-secondary"
            strokeWidth="2"
          />
          <circle
            r="25"
            fill="none"
            className="stroke-secondary/80"
            strokeWidth="1"
          />
          <circle
            r="20"
            fill="none"
            className="stroke-secondary/60"
            strokeWidth="1"
          />
          <circle
            r="15"
            fill="none"
            className="stroke-secondary/40"
            strokeWidth="0.5"
          />

          {/* Médaillon central */}
          <circle r="12" className="fill-primary" />
          <circle r="10" className="fill-secondary/20" />

          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontSize="14"
            className="fill-secondary font-bold"
          >
            241
          </text>
        </g>

        {/* Ornements aux coins */}
        {[
          [10, 10],
          [90, 10],
          [10, 130],
          [90, 130],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <circle r="6" className="fill-secondary" />
            <circle r="4" className="fill-primary" />
            <circle r="2" className="fill-secondary/50" />
          </g>
        ))}

        {/* Fioritures décoratives sur les bords */}
        <g className="opacity-30">
          <path
            d="M20,5 Q30,10 40,5 M60,5 Q70,10 80,5"
            className="stroke-secondary"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M20,135 Q30,130 40,135 M60,135 Q70,130 80,135"
            className="stroke-secondary"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M5,30 Q10,40 5,50 M5,90 Q10,100 5,110"
            className="stroke-secondary"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M95,30 Q90,40 95,50 M95,90 Q90,100 95,110"
            className="stroke-secondary"
            strokeWidth="0.5"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

// Composant principal affichant tout le jeu
const FullDeck: React.FC = () => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];

  return (
    <div className="bg-background p-5">
      <h2 className="text-foreground mb-5 text-center text-2xl font-bold">
        Jeu de cartes complet - 52 cartes
      </h2>

      {suits.map((suit) => (
        <div key={suit} className="mb-8">
          <h3
            className={cn(
              "mb-4 text-xl font-semibold capitalize",
              suit === "hearts" || suit === "diamonds"
                ? "text-primary"
                : "text-foreground",
            )}
          >
            {suit === "hearts"
              ? "♥ Cœurs"
              : suit === "diamonds"
                ? "♦ Carreaux"
                : suit === "clubs"
                  ? "♣ Trèfles"
                  : "♠ Piques"}
          </h3>

          <div className="game-grid">
            {ranks.map((rank) => (
              <div key={`${suit}-${rank}`} className="flex justify-center">
                <PlayingCard suit={suit} rank={rank} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Dos de carte bonus */}
      <div className="mt-10 text-center">
        <h3 className="text-secondary mb-4 text-xl font-semibold">
          Dos de carte
        </h3>
        <div className="card-shadow-lg inline-block">
          <CardBack />
        </div>
      </div>
    </div>
  );
};

// New GameCard component with size variants
interface GameCardProps {
  suit?: "hearts" | "diamonds" | "clubs" | "spades";
  rank?: string;
  size?: "small" | "medium" | "large";
  faceDown?: boolean;
  className?: string;
}

export function GameCard({
  suit = "hearts",
  rank = "A",
  size = "medium",
  faceDown = false,
  className,
}: GameCardProps) {
  const sizes = {
    small: { width: 32, height: 45 },
    medium: { width: 50, height: 70 },
    large: { width: 70, height: 98 },
  };

  const { width, height } = sizes[size];

  if (faceDown) {
    return <CardBack width={width} height={height} className={className} />;
  }

  return (
    <PlayingCard
      suit={suit}
      rank={rank as Rank}
      width={width}
      height={height}
      className={className}
    />
  );
}

// Composant pour le deck d'un joueur avec disposition en arc
interface PlayerDeckProps {
  cards: Card[];
  isOpponent?: boolean;
  className?: string;
  hidden?: boolean;
  isPlayerTurn?: boolean;
  onCardClick?: (cardIndex: number) => void;
  onPlayCard?: () => void;
  hoveredCard?: number | null;
  selectedCard?: number | null;
  onCardHover?: (cardIndex: number | null) => void;
}

export function PlayerDeck({
  cards,
  isOpponent = false,
  className,
  hidden = false,
  isPlayerTurn = false,
  onCardClick,
  onPlayCard,
  hoveredCard,
  selectedCard,
  onCardHover,
}: PlayerDeckProps) {
  const { playSound } = useSound();
  const cardWidth = isOpponent ? 80 : 110;
  const cardHeight = isOpponent ? 112 : 154;
  const cardSpacing = cardWidth + 8;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${cards.length * cardSpacing - cardSpacing + cardWidth}px`,
          height: `${cardHeight}px`,
        }}
      >
        {cards.map((card, index) => {
          // Centrer les cartes autour du point central
          const totalWidth =
            cards.length * cardSpacing - cardSpacing + cardWidth;
          const startOffset = -totalWidth / 2 + cardWidth / 2;
          const translateX = startOffset + index * cardSpacing;

          // États des cartes
          const isCardPlayable = isPlayerTurn && card.jouable;
          const isCardHovered = hoveredCard === index;
          const isCardSelected = selectedCard === index;

          return (
            <div
              key={index}
              className={cn("absolute transition-all duration-300", {
                "cursor-pointer": isCardPlayable,
                "cursor-not-allowed": !isCardPlayable,
                "hover:scale-105 active:scale-95": isCardPlayable,
                "z-50": isCardHovered,
                "touch-manipulation": true,
              })}
              style={{
                transform: `translateX(${translateX}px)`,
                zIndex: isCardHovered ? 50 : 10 + index,
              }}
              onMouseEnter={() => onCardHover?.(index)}
              onMouseLeave={() => onCardHover?.(null)}
              onClick={() => {
                if (isCardPlayable && onCardClick) {
                  void playSound("card_select");
                  onCardClick(index);
                }
              }}
            >
              <AnimatedCard
                card={card}
                width={cardWidth}
                height={cardHeight}
                isOpponent={isOpponent}
                isHovered={isCardHovered}
                isSelected={isCardSelected}
                hidden={hidden}
                onClick={() => {
                  if (card.jouable && onCardClick) {
                    void playSound("card_select");
                    onCardClick(index);
                  }
                }}
                onPlayClick={() => {
                  if (onPlayCard) {
                    void playSound("card_play");
                    onPlayCard();
                  }
                }}
                onHover={(hovered) => {
                  void playSound("card_hover", { volume: 0.1 });
                  onCardHover?.(hovered ? index : null);
                }}
                className="h-full w-full shadow-md"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Composant pour les cartes en jeu (pile centrale)
interface PlayedCardsProps {
  cards: PlayedCard[];
  className?: string;
}

export function PlayedCards({ cards, className }: PlayedCardsProps) {
  const userData = useUserDataContext();

  const opponentCards = cards.filter(
    (card) => card.playerUsername !== userData?.user.username,
  );
  const playerCards = cards.filter(
    (card) => card.playerUsername === userData?.user.username,
  );

  return (
    <div
      className={cn(
        "relative flex min-h-[200px] flex-col items-center justify-center gap-4",
        className,
      )}
    >
      {cards.length === 0 ? (
        <div className="flex items-center justify-center text-center">
          <div className="rounded-full border-2 border-amber-300/40 bg-amber-200/10 p-4">
            <div className="text-xs text-amber-100/80">Aucune carte jouée</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {/* Cartes de l'adversaire en haut */}
          {opponentCards.length > 0 && (
            <div className="flex items-center gap-3">
              {opponentCards.map((playedCard, index) => (
                <div
                  key={`opponent-${playedCard.card.suit}-${playedCard.card.rank}-${index}`}
                  className="relative transition-transform duration-300"
                >
                  <PlayingCard
                    suit={playedCard.card.suit}
                    rank={playedCard.card.rank}
                    width={77}
                    height={108}
                    className="shadow-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Cartes du joueur en bas */}
          {playerCards.length > 0 && (
            <div className="flex items-center gap-3">
              {playerCards.map((playedCard, index) => (
                <div
                  key={`player-${playedCard.card.suit}-${playedCard.card.rank}-${index}`}
                  className="relative transition-transform duration-300"
                >
                  <PlayingCard
                    suit={playedCard.card.suit}
                    rank={playedCard.card.rank}
                    width={77}
                    height={108}
                    className="shadow-lg"
                  />

                  <div className="absolute -top-4 right-1/2 translate-x-1/2 rounded bg-amber-500/70 px-1 text-xs text-amber-100">
                    {playedCard.round}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { PlayingCard, CardBack, FullDeck };
export default FullDeck;
