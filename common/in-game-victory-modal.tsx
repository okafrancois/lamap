"use client";

import { LibButton } from "@/components/library/button";
import { useSound } from "@/hooks/use-sound";
import { useEffect } from "react";

interface InGameVictoryModalProps {
  isVisible: boolean;
  victoryData: {
    isVictory: boolean;
    playerKoras: number;
    opponentKoras: number;
    betAmount: number;
    korasWon: number;
    victoryType: {
      type: string;
      title: string;
      description: string;
      multiplier: string;
      special: boolean;
    };
    victoryMessage: string;
  };
  onClose: () => void;
  onNewGame: () => void;
  onBackToSelection: () => void;
}

export function InGameVictoryModal({
  isVisible,
  victoryData,
  onClose,
  onNewGame,
  onBackToSelection,
}: InGameVictoryModalProps) {
  const { playSound } = useSound();

  useEffect(() => {
    if (isVisible) {
      void playSound("modal_open");

      setTimeout(() => {
        if (victoryData.isVictory) {
          switch (victoryData.victoryType.type) {
            case "triple_kora":
              void playSound("kora_triple");
              break;
            case "double_kora":
              void playSound("kora_double");
              break;
            case "simple_kora":
              void playSound("kora_simple");
              break;
            case "auto_sum":
            case "auto_lowest":
            case "auto_sevens":
              void playSound("auto_victory");
              break;
            default:
              void playSound("victory");
          }
        } else {
          void playSound("defeat");
        }
      }, 500);
    }
  }, [
    isVisible,
    victoryData.isVictory,
    victoryData.victoryType.type,
    playSound,
  ]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="mx-4 w-full max-w-md rounded-2xl border-4 border-amber-400/80 bg-slate-900/95 p-6 backdrop-blur-sm">
        <div className="space-y-4 text-center">
          <div
            className={`mx-auto flex size-16 items-center justify-center rounded-full text-2xl ${
              victoryData.isVictory
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {victoryData.isVictory ? "🏆" : "💀"}
          </div>

          <div>
            <h3
              className={`text-2xl font-bold ${
                victoryData.isVictory ? "text-green-400" : "text-red-400"
              }`}
            >
              {victoryData.victoryType.special && victoryData.isVictory
                ? victoryData.victoryType.title
                : victoryData.isVictory
                  ? "Victoire !"
                  : "Défaite"}
            </h3>
            <p className="mt-2 text-slate-300">
              {victoryData.victoryType.special
                ? victoryData.victoryType.description
                : victoryData.victoryMessage}
            </p>

            {victoryData.victoryType.special &&
              victoryData.isVictory &&
              victoryData.victoryType.multiplier !== "x1" && (
                <div className="mt-2 inline-block rounded-full bg-yellow-500 px-3 py-1 text-sm font-bold text-yellow-900">
                  Mise {victoryData.victoryType.multiplier} !
                </div>
              )}
          </div>

          <div className="rounded-lg bg-slate-800/50 p-4">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-white">
                  {victoryData.playerKoras}
                </div>
                <div className="text-slate-400">Vous</div>
              </div>
              <div className="text-slate-500">vs</div>
              <div className="text-center">
                <div className="font-semibold text-white">
                  {victoryData.opponentKoras}
                </div>
                <div className="text-slate-400">Adversaire</div>
              </div>
            </div>

            {victoryData.korasWon > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 text-green-400">
                <span>
                  {victoryData.isVictory ? "+" : "-"}
                  {victoryData.korasWon} koras
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <LibButton
              onClick={onBackToSelection}
              variant="outline"
              className="flex-1"
            >
              Changer mode
            </LibButton>
            <LibButton
              onClick={() => {
                onClose();
                onNewGame();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Rejouer
            </LibButton>
          </div>
        </div>
      </div>
    </div>
  );
}
