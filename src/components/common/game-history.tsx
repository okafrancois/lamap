"use client";

import { useState } from "react";
import { LibButton } from "@/components/library/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconHistory,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconX,
  IconEye,
  IconCards,
} from "@tabler/icons-react";

export interface GameHistoryEntry {
  round: number;
  playerCard: { suit: string; rank: string } | null;
  opponentCard: { suit: string; rank: string } | null;
  winner: "player" | "opponent";
  playerHasHand: boolean;
}

interface GameHistoryProps {
  isVisible: boolean;
  history: GameHistoryEntry[];
  currentViewRound: number;
  onClose: () => void;
  onRoundSelect: (round: number) => void;
}

export function GameHistory({
  isVisible,
  history,
  currentViewRound,
  onClose,
  onRoundSelect,
}: GameHistoryProps) {
  if (!isVisible) return null;

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === "hearts" || suit === "diamonds"
      ? "text-red-500"
      : "text-gray-800";
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm duration-300">
      <Card className="mx-4 max-h-[80vh] w-full max-w-2xl border-amber-500/30 bg-gradient-to-br from-slate-800 to-slate-900">
        <CardHeader className="border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-200">
              <IconHistory className="size-5" />
              Historique de la partie
            </CardTitle>
            <LibButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-amber-200 hover:text-amber-100"
            >
              <IconX className="size-4" />
            </LibButton>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto p-6">
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <IconCards className="mx-auto mb-3 size-12 opacity-50" />
                <p>Aucune carte jouée pour le moment</p>
              </div>
            ) : (
              history.map((entry, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    currentViewRound === entry.round
                      ? "scale-[1.02] border-amber-500 bg-amber-500/10"
                      : "border-gray-600 bg-gray-800/50 hover:border-amber-500/50"
                  }`}
                  onClick={() => onRoundSelect(entry.round)}
                >
                  {/* Indicateur de tour sélectionné */}
                  {currentViewRound === entry.round && (
                    <div className="absolute -top-2 -right-2 rounded-full bg-amber-500 p-1 text-black">
                      <IconEye className="size-3" />
                    </div>
                  )}

                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-amber-200">
                      Tour {entry.round}
                    </h3>
                    <div
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        entry.winner === "player"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {entry.winner === "player" ? "🏆 Vous" : "🏆 IA"}
                    </div>
                  </div>

                  {/* Cartes jouées */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Carte du joueur */}
                    <div className="text-center">
                      <div className="mb-2 text-sm text-gray-400">
                        Votre carte
                      </div>
                      {entry.playerCard ? (
                        <div className="inline-block rounded-lg bg-white p-3 shadow-md">
                          <span
                            className={`text-2xl font-bold ${getSuitColor(entry.playerCard.suit)}`}
                          >
                            {entry.playerCard.rank}
                            <span className="ml-1">
                              {getSuitSymbol(entry.playerCard.suit)}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-gray-600 p-3 text-gray-400">
                          Pas jouée
                        </div>
                      )}
                    </div>

                    {/* Carte de l'IA */}
                    <div className="text-center">
                      <div className="mb-2 text-sm text-gray-400">Carte IA</div>
                      {entry.opponentCard ? (
                        <div className="inline-block rounded-lg bg-white p-3 shadow-md">
                          <span
                            className={`text-2xl font-bold ${getSuitColor(entry.opponentCard.suit)}`}
                          >
                            {entry.opponentCard.rank}
                            <span className="ml-1">
                              {getSuitSymbol(entry.opponentCard.suit)}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-gray-600 p-3 text-gray-400">
                          Pas jouée
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Indication de qui avait la main */}
                  <div className="mt-3 text-center">
                    <span className="text-xs text-gray-400">
                      {entry.playerHasHand
                        ? "🤲 Vous aviez la main"
                        : "🤲 IA avait la main"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Contrôles de navigation */}
          {history.length > 0 && (
            <div className="mt-6 flex justify-center gap-2 border-t border-gray-600 pt-4">
              <LibButton
                variant="outline"
                size="sm"
                disabled={currentViewRound <= 1}
                onClick={() => onRoundSelect(Math.max(1, currentViewRound - 1))}
                className="border-amber-500/30 text-amber-200"
              >
                <IconPlayerSkipBack className="size-4" />
                Tour précédent
              </LibButton>
              <LibButton
                variant="outline"
                size="sm"
                disabled={currentViewRound >= history.length}
                onClick={() =>
                  onRoundSelect(Math.min(history.length, currentViewRound + 1))
                }
                className="border-amber-500/30 text-amber-200"
              >
                Tour suivant
                <IconPlayerSkipForward className="size-4" />
              </LibButton>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
