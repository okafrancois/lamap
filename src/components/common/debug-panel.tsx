"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconBug,
  IconPlayerPlay,
  IconPlayerStop,
  IconCards,
  IconChevronUp,
  IconChevronDown,
  IconX,
} from "@tabler/icons-react";
import type { GamePhase, PlayerTurn } from "@/hooks/use-game-state";

interface DebugPanelProps {
  // États actuels
  phase: GamePhase;
  currentTurn: PlayerTurn;
  playerCardsCount: number;
  opponentCardsCount: number;
  playedCardsCount: number;
  playableCards: number[];
  hoveredCard: number | null;
  selectedCard: number | null;
  isAnimating: boolean;

  // Actions
  onPhaseChange: (phase: GamePhase) => void;
  onTurnChange: (turn: PlayerTurn) => void;
  onStartGame: () => void;
  onEndGame: () => void;
  onSetVictory: () => void;
  onSetDefeat: () => void;
  onPlayRandomCard: () => void;
  onSetPlayableCards: (cards: number[]) => void;
  onSimulateHover: (cardIndex: number | null) => void;
  onSimulateSelect: (cardIndex: number | null) => void;
}

export function DebugPanel({
  phase,
  currentTurn,
  playerCardsCount,
  opponentCardsCount,
  playedCardsCount,
  playableCards,
  hoveredCard,
  selectedCard,
  isAnimating,
  onPhaseChange,
  onTurnChange,
  onStartGame,
  onEndGame,
  onSetVictory,
  onSetDefeat,
  onPlayRandomCard,
  onSetPlayableCards,
  onSimulateHover,
  onSimulateSelect,
}: DebugPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-white/20"
        >
          <IconBug className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 rounded-lg border border-white/20 bg-black/40 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-white/10 bg-white/10 p-2">
        <h3 className="flex items-center gap-1 text-sm font-medium text-white">
          <IconBug className="size-4 text-orange-400" />
          Debug
        </h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            {isCollapsed ? (
              <IconChevronUp className="size-3" />
            ) : (
              <IconChevronDown className="size-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <IconX className="size-3" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="w-64 space-y-3 p-3">
          {/* États Actuels - Format compact */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-blue-200">
              États Actuels
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-white/80">
                Phase:{" "}
                <Badge
                  variant={phase === "playing" ? "default" : "secondary"}
                  className="ml-1 text-xs"
                >
                  {phase}
                </Badge>
              </div>
              <div className="text-white/80">
                Tour:{" "}
                <Badge
                  variant={currentTurn === "player" ? "default" : "outline"}
                  className="ml-1 text-xs"
                >
                  {currentTurn}
                </Badge>
              </div>
              <div className="text-white/80">
                Animation:{" "}
                <Badge
                  variant={isAnimating ? "destructive" : "secondary"}
                  className="ml-1 text-xs"
                >
                  {isAnimating ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-white/80">
                Carte survolée:{" "}
                <span className="text-amber-300">
                  {hoveredCard !== null ? `#${hoveredCard}` : "Aucune"}
                </span>
              </div>
              <div className="col-span-2 text-white/80">
                Carte sélectionnée:{" "}
                <span className="text-blue-300">
                  {selectedCard !== null ? `#${selectedCard}` : "Aucune"}
                </span>
              </div>
            </div>
          </div>

          {/* Cartes - Format compact */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-green-200">Cartes</h4>
            <div className="flex justify-between text-xs">
              <div className="text-center">
                <div className="text-[10px] text-white/60">Joueur</div>
                <Badge variant="outline" className="border-white/30 text-white">
                  {playerCardsCount}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-white/60">Jouées</div>
                <Badge variant="outline" className="border-white/30 text-white">
                  {playedCardsCount}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-white/60">Adversaire</div>
                <Badge variant="outline" className="border-white/30 text-white">
                  {opponentCardsCount}
                </Badge>
              </div>
            </div>
            <div className="mt-2 text-xs text-white/80">
              Cartes jouables:{" "}
              <span className="text-yellow-300">
                {playableCards.length > 0 ? playableCards.join(", ") : "Aucune"}
              </span>
            </div>
          </div>

          {/* Actions Rapides */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-purple-200">
              Actions Rapides
            </h4>
            <div className="grid grid-cols-2 gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onStartGame}
                className="h-7 border border-white/20 text-xs text-white hover:bg-white/20"
              >
                <IconPlayerPlay className="mr-1 size-3" />
                Démarrer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onEndGame}
                className="h-7 border border-white/20 text-xs text-white hover:bg-white/20"
              >
                <IconPlayerStop className="mr-1 size-3" />
                Terminer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onSetVictory}
                className="h-7 border border-green-400/30 text-xs text-green-300 hover:bg-green-500/20"
              >
                🏆 Victoire
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onSetDefeat}
                className="h-7 border border-red-400/30 text-xs text-red-300 hover:bg-red-500/20"
              >
                💀 Défaite
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onPlayRandomCard}
              className="mt-1 h-7 w-full border border-white/20 text-xs text-white hover:bg-white/20"
            >
              <IconCards className="mr-1 size-3" />
              Jouer une carte aléatoire
            </Button>
          </div>

          {/* Contrôles - Ultra compact */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-orange-200">
              Contrôles
            </h4>

            {/* Phase */}
            <div className="mb-2">
              <div className="mb-1 text-[10px] text-white/60">Phase</div>
              <div className="grid grid-cols-5 gap-1">
                {(
                  ["waiting", "playing", "ended", "victory", "defeat"] as const
                ).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={phase === p ? "default" : "ghost"}
                    onClick={() => onPhaseChange(p)}
                    className="h-6 border border-white/10 text-[9px] text-white hover:bg-white/20"
                  >
                    {p === "victory"
                      ? "🏆"
                      : p === "defeat"
                        ? "💀"
                        : p.charAt(0).toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tour */}
            <div className="mb-2">
              <div className="mb-1 text-[10px] text-white/60">Tour</div>
              <div className="grid grid-cols-2 gap-1">
                {(["player", "opponent"] as const).map((turn) => (
                  <Button
                    key={turn}
                    size="sm"
                    variant={currentTurn === turn ? "default" : "ghost"}
                    onClick={() => onTurnChange(turn)}
                    className="h-6 border border-white/10 text-[10px] text-white hover:bg-white/20"
                  >
                    {turn === "player" ? "Joueur" : "Adversaire"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cartes jouables */}
            <div className="mb-2">
              <div className="mb-1 text-[10px] text-white/60">
                Cartes jouables
              </div>
              <div className="grid grid-cols-4 gap-1">
                {["∅", "0,1", "All", "#2"].map((preset, index) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (index === 0) onSetPlayableCards([]);
                      else if (index === 1) onSetPlayableCards([0, 1]);
                      else if (index === 2) onSetPlayableCards([0, 1, 2]);
                      else onSetPlayableCards([2]);
                    }}
                    className="h-6 border border-white/10 text-[10px] text-white hover:bg-white/20"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Simulation */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-[10px] text-white/60">Survol</div>
                <div className="grid grid-cols-4 gap-1">
                  {[null, 0, 1, 2].map((cardIndex) => (
                    <Button
                      key={cardIndex ?? "none"}
                      size="sm"
                      variant="ghost"
                      onClick={() => onSimulateHover(cardIndex)}
                      className="h-5 border border-white/10 text-[9px] text-white hover:bg-white/20"
                    >
                      {cardIndex !== null ? cardIndex : "∅"}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-[10px] text-white/60">Sélection</div>
                <div className="grid grid-cols-4 gap-1">
                  {[null, 0, 1, 2].map((cardIndex) => (
                    <Button
                      key={cardIndex ?? "none"}
                      size="sm"
                      variant="ghost"
                      onClick={() => onSimulateSelect(cardIndex)}
                      className="h-5 border border-white/10 text-[9px] text-white hover:bg-white/20"
                    >
                      {cardIndex !== null ? cardIndex : "∅"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
