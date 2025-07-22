"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconBug,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconCards,
  IconEye,
  IconEyeOff,
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
  onPlayRandomCard,
  onSetPlayableCards,
  onSimulateHover,
  onSimulateSelect,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const getPhaseColor = (phase: GamePhase) => {
    switch (phase) {
      case "waiting":
        return "bg-gray-500";
      case "playing":
        return "bg-green-500";
      case "ended":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTurnColor = (turn: PlayerTurn) => {
    return turn === "player" ? "bg-blue-500" : "bg-purple-500";
  };

  if (!isOpen) {
    return (
      <div
        className="fixed z-[100] cursor-move"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <Button
          size="sm"
          variant="outline"
          className="bg-background/90 border-2 shadow-lg backdrop-blur-sm"
          onClick={() => setIsOpen(true)}
        >
          <IconBug className="size-4" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div
      className="fixed z-[100] w-80"
      style={{ left: position.x, top: position.y }}
    >
      <Card className="bg-background/95 border-2 shadow-2xl backdrop-blur-sm">
        <CardHeader
          className="cursor-move pb-2 select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBug className="size-4 text-orange-500" />
              <CardTitle className="text-sm">Panneau de Debug</CardTitle>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <IconX className="size-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          {/* États Actuels */}
          <div>
            <h4 className="text-foreground/80 mb-2 font-medium">
              États Actuels
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Phase:</span>
                <Badge className={`${getPhaseColor(phase)} text-white`}>
                  {phase}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Tour:</span>
                <Badge className={`${getTurnColor(currentTurn)} text-white`}>
                  {currentTurn}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Animation:</span>
                <Badge variant={isAnimating ? "destructive" : "secondary"}>
                  {isAnimating ? "En cours" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Carte survolée:</span>
                <Badge variant="outline">
                  {hoveredCard !== null ? `#${hoveredCard}` : "Aucune"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Carte sélectionnée:</span>
                <Badge variant={selectedCard !== null ? "default" : "outline"}>
                  {selectedCard !== null ? `#${selectedCard}` : "Aucune"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cartes */}
          <div>
            <h4 className="text-foreground/80 mb-2 font-medium">Cartes</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-muted-foreground text-[10px]">Joueur</div>
                <Badge variant="secondary">{playerCardsCount}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Jouées</div>
                <Badge variant="secondary">{playedCardsCount}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">
                  Adversaire
                </div>
                <Badge variant="secondary">{opponentCardsCount}</Badge>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-muted-foreground mb-1 text-[10px]">
                Cartes jouables: {playableCards.join(", ") || "Aucune"}
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions Rapides */}
          <div>
            <h4 className="text-foreground/80 mb-2 font-medium">
              Actions Rapides
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onStartGame}
                disabled={phase === "playing"}
                className="text-xs"
              >
                <IconPlayerPlay className="mr-1 size-3" />
                Démarrer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onEndGame}
                disabled={phase === "ended"}
                className="text-xs"
              >
                <IconPlayerPause className="mr-1 size-3" />
                Terminer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onPlayRandomCard}
                disabled={playableCards.length === 0 || isAnimating}
                className="col-span-2 text-xs"
              >
                <IconCards className="mr-1 size-3" />
                Jouer une carte aléatoire
              </Button>
            </div>
          </div>

          <Separator />

          {/* Contrôles Avancés */}
          <div>
            <h4 className="text-foreground/80 mb-2 font-medium">Contrôles</h4>
            <div className="space-y-2">
              <div>
                <div className="text-muted-foreground mb-1 text-[10px]">
                  Phase
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(["waiting", "playing", "ended"] as GamePhase[]).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={phase === p ? "default" : "outline"}
                      onClick={() => onPhaseChange(p)}
                      className="h-6 px-2 py-1 text-[10px]"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1 text-[10px]">
                  Tour
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(["player", "opponent"] as PlayerTurn[]).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={currentTurn === t ? "default" : "outline"}
                      onClick={() => onTurnChange(t)}
                      className="h-6 px-2 py-1 text-[10px]"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1 text-[10px]">
                  Cartes jouables
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPlayableCards([])}
                    className="h-6 px-1 py-1 text-[10px]"
                  >
                    Aucune
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPlayableCards([0, 1])}
                    className="h-6 px-1 py-1 text-[10px]"
                  >
                    0,1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPlayableCards([0, 1, 2, 3, 4])}
                    className="h-6 px-1 py-1 text-[10px]"
                  >
                    Toutes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPlayableCards([2])}
                    className="h-6 px-1 py-1 text-[10px]"
                  >
                    #2
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1 text-[10px]">
                  Simulation survol
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSimulateHover(null)}
                    className="h-6 px-1 py-1 text-[10px]"
                  >
                    <IconEyeOff className="size-2" />
                  </Button>
                  {[0, 1, 2].map((index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={hoveredCard === index ? "default" : "outline"}
                      onClick={() => onSimulateHover(index)}
                      className="h-6 px-1 py-1 text-[10px]"
                    >
                      #{index}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1 text-[10px]">
                  Simulation sélection
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSimulateSelect(null)}
                    className="h-6 px-1 py-1 text-[10px]"
                  >
                    Aucune
                  </Button>
                  {[0, 1, 2].map((index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={selectedCard === index ? "default" : "outline"}
                      onClick={() => onSimulateSelect(index)}
                      className="h-6 px-1 py-1 text-[10px]"
                    >
                      #{index}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions de Reset */}
          <div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onPhaseChange("waiting");
                onTurnChange("player");
                onSetPlayableCards([]);
                onSimulateHover(null);
                onSimulateSelect(null);
              }}
              className="w-full text-xs"
            >
              <IconRefresh className="mr-1 size-3" />
              Reset Complet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
