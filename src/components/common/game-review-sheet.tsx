"use client";

import { useState, useEffect } from "react";
import { LibButton } from "@/components/library/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GameBoard } from "./game-board";
import {
  IconPlayerSkipBack,
  IconPlayerTrackPrev,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerTrackNext,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import type { Card } from "./deck";

interface GameReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data - en vrai ça viendrait du game engine
const mockHistory = [
  {
    round: 1,
    playerCards: [
      { id: "1", suit: "hearts", rank: "3", jouable: false },
      { id: "2", suit: "clubs", rank: "7", jouable: false },
      { id: "3", suit: "spades", rank: "K", jouable: false },
      { id: "4", suit: "diamonds", rank: "2", jouable: false },
    ] as Card[],
    opponentCards: [
      { id: "5", suit: "spades", rank: "4", jouable: false },
      { id: "6", suit: "hearts", rank: "8", jouable: false },
      { id: "7", suit: "clubs", rank: "Q", jouable: false },
      { id: "8", suit: "diamonds", rank: "A", jouable: false },
    ] as Card[],
    playedCards: [
      { id: "1", suit: "hearts", rank: "3", jouable: false },
      { id: "5", suit: "spades", rank: "4", jouable: false },
    ] as Card[],
    playerWithHand: "player" as const,
    currentTurn: "opponent" as const,
  },
  {
    round: 2,
    playerCards: [
      { id: "2", suit: "clubs", rank: "7", jouable: false },
      { id: "3", suit: "spades", rank: "K", jouable: false },
      { id: "4", suit: "diamonds", rank: "2", jouable: false },
    ] as Card[],
    opponentCards: [
      { id: "6", suit: "hearts", rank: "8", jouable: false },
      { id: "7", suit: "clubs", rank: "Q", jouable: false },
      { id: "8", suit: "diamonds", rank: "A", jouable: false },
    ] as Card[],
    playedCards: [
      { id: "2", suit: "clubs", rank: "7", jouable: false },
      { id: "7", suit: "clubs", rank: "Q", jouable: false },
    ] as Card[],
    playerWithHand: "opponent" as const,
    currentTurn: "player" as const,
  },
  {
    round: 3,
    playerCards: [
      { id: "3", suit: "spades", rank: "K", jouable: false },
      { id: "4", suit: "diamonds", rank: "2", jouable: false },
    ] as Card[],
    opponentCards: [
      { id: "6", suit: "hearts", rank: "8", jouable: false },
      { id: "8", suit: "diamonds", rank: "A", jouable: false },
    ] as Card[],
    playedCards: [
      { id: "4", suit: "diamonds", rank: "2", jouable: false },
      { id: "6", suit: "hearts", rank: "8", jouable: false },
    ] as Card[],
    playerWithHand: "player" as const,
    currentTurn: "opponent" as const,
  },
];

export function GameReviewSheet({ open, onOpenChange }: GameReviewSheetProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const totalRounds = mockHistory.length;

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentRound((current) => {
        if (current >= totalRounds) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, totalRounds]);

  const currentData = mockHistory[currentRound - 1];

  const handleFirst = () => setCurrentRound(1);
  const handlePrevious = () => setCurrentRound(Math.max(1, currentRound - 1));
  const handleNext = () =>
    setCurrentRound(Math.min(totalRounds, currentRound + 1));
  const handleLast = () => setCurrentRound(totalRounds);
  const handlePlayPause = () => setIsPlaying(!isPlaying);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-none" side="bottom">
        <div className="flex h-[90vh] flex-col">
          <SheetHeader className="border-border border-b p-4">
            <SheetTitle className="flex items-center justify-between">
              <span>🎬 Review de la partie</span>
              <span className="text-muted-foreground text-sm">
                Tour {currentRound} / {totalRounds}
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* GameBoard réutilisé avec les bonnes props */}
          <div className="flex-1">
            {currentData && (
              <GameBoard
                playerCards={currentData.playerCards}
                opponentCards={currentData.opponentCards}
                playedCards={currentData.playedCards}
                gameStarted={true}
                currentTurn={currentData.currentTurn}
                playerWithHand={currentData.playerWithHand}
                round={currentRound}
                maxRounds={totalRounds}
                gameStatus="playing"
                className="h-full"
              />
            )}
          </div>

          {/* Contrôles en bas */}
          <div className="border-border bg-background border-t p-4">
            {/* Timeline */}
            <div className="mx-auto mb-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-16 text-sm">
                  Tour 1
                </span>
                <div className="relative flex-1">
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="from-primary to-secondary h-full bg-gradient-to-r transition-all duration-300"
                      style={{
                        width: `${(currentRound / totalRounds) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-between">
                    {Array.from({ length: totalRounds }, (_, i) => i + 1).map(
                      (round) => (
                        <button
                          key={round}
                          onClick={() => setCurrentRound(round)}
                          className={`h-3 w-3 rounded-full border-2 transition-all hover:scale-110 ${
                            round <= currentRound
                              ? "bg-primary border-primary/70 shadow-primary/50 shadow-lg"
                              : "bg-muted border-border hover:bg-muted/70"
                          }`}
                          title={`Tour ${round}`}
                        />
                      ),
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground w-16 text-right text-sm">
                  Tour {totalRounds}
                </span>
              </div>
            </div>

            {/* Contrôles de lecture */}
            <div className="flex items-center justify-center gap-2">
              <LibButton
                variant="ghost"
                size="sm"
                onClick={handleFirst}
                disabled={currentRound <= 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <IconPlayerSkipBack className="size-4" />
              </LibButton>

              <LibButton
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentRound <= 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <IconPlayerTrackPrev className="size-4" />
              </LibButton>

              <LibButton
                variant="default"
                size="sm"
                onClick={handlePlayPause}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3"
              >
                {isPlaying ? (
                  <IconPlayerPause className="size-4" />
                ) : (
                  <IconPlayerPlay className="size-4" />
                )}
              </LibButton>

              <LibButton
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentRound >= totalRounds}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <IconPlayerTrackNext className="size-4" />
              </LibButton>

              <LibButton
                variant="ghost"
                size="sm"
                onClick={handleLast}
                disabled={currentRound >= totalRounds}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <IconPlayerSkipForward className="size-4" />
              </LibButton>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
