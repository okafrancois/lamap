"use client";

import { LibButton } from "@/components/library/button";
import {
  IconTrophy,
  IconSkull,
  IconRefresh,
  IconCoins,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useSound } from "@/hooks/use-sound";
import { useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface VictoryModalProps {
  isVisible: boolean;
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
  onPlayAgain: () => void;
  onClose: () => void;
  onViewHistory?: () => void;
  onEnterReview?: () => void;
}

export function VictoryModal({
  isVisible,
  isVictory,
  playerKoras,
  opponentKoras,
  betAmount,
  korasWon,
  victoryType,
  victoryMessage,
  onPlayAgain,
  onClose,
  onEnterReview,
}: VictoryModalProps) {
  const { playSound } = useSound();
  const isMobile = useMobile();

  useEffect(() => {
    if (isVisible) {
      void playSound("modal_open");

      setTimeout(() => {
        if (isVictory) {
          switch (victoryType.type) {
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
  }, [isVisible, isVictory, victoryType.type, playSound]);

  if (!isVisible) return null;

  return (
    <Sheet open={isVisible} onOpenChange={onClose}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={"min-h-[100vh] w-[400px] sm:w-[500px]"}
      >
        <SheetHeader>
          <SheetTitle
            className={`text-center text-2xl font-bold ${
              isVictory ? "text-primary" : "text-destructive"
            }`}
          >
            {victoryType.special && isVictory
              ? victoryType.title
              : isVictory
                ? "VICTOIRE !"
                : "DÉFAITE !"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-6">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              isVictory
                ? "bg-primary shadow-primary/50 shadow-lg"
                : "bg-destructive shadow-destructive/50 shadow-lg"
            }`}
          >
            {isVictory ? (
              <IconTrophy className="text-primary-foreground size-10" />
            ) : (
              <IconSkull className="text-destructive-foreground size-10" />
            )}
          </div>

          <div className="text-center">
            <p className="text-foreground text-lg font-medium">
              {victoryType.special ? victoryType.description : victoryMessage}
            </p>

            {victoryType.special &&
              isVictory &&
              victoryType.multiplier !== "x1" && (
                <div className="mt-2 inline-block rounded-full bg-yellow-500 px-3 py-1 text-sm font-bold text-yellow-900">
                  Mise {victoryType.multiplier} !
                </div>
              )}
          </div>

          <div className="bg-muted/30 border-border space-y-3 rounded-lg border p-4">
            <div className="text-foreground flex items-center justify-center gap-2">
              <IconCoins className="size-5" />
              <span className="font-semibold">Résumé de la partie</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground">Mise engagée</div>
                <div className="text-foreground text-lg font-bold">
                  {betAmount} koras
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">
                  {isVictory ? "Koras gagnés" : "Koras perdus"}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isVictory ? "text-primary" : "text-destructive"
                  }`}
                >
                  {isVictory ? "+" : "-"}
                  {korasWon} koras
                </div>
              </div>
            </div>

            <div className="border-border border-t pt-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground">Vos koras</div>
                  <div className="text-primary text-lg font-bold">
                    {playerKoras}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">IA koras</div>
                  <div className="text-secondary text-lg font-bold">
                    {opponentKoras}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {onEnterReview && (
              <LibButton
                onClick={onEnterReview}
                variant="outline"
                className="border-secondary text-secondary w-full"
                icon={<IconPlayerPlay className="size-4" />}
              >
                🎬 Revoir la partie
              </LibButton>
            )}
            <div className="flex gap-3">
              <LibButton
                onClick={onPlayAgain}
                className={`flex-1 ${
                  isVictory
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-destructive hover:bg-destructive/90"
                }`}
                icon={<IconRefresh className="size-4" />}
              >
                Rejouer
              </LibButton>
              <LibButton
                onClick={onClose}
                variant="outline"
                className="border-border text-foreground hover:bg-muted flex-1"
              >
                Fermer
              </LibButton>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
