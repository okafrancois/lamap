"use client";

import { LibButton } from "@/components/library/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconTrophy,
  IconSkull,
  IconRefresh,
  IconCoins,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useSound } from "@/hooks/use-sound";
import { useEffect, useCallback } from "react";
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
  gameLog?: Array<{ message: string; timestamp: number }>;
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
  gameLog = [],
  onPlayAgain,
  onClose,
  onEnterReview,
}: VictoryModalProps) {
  const { playSound } = useSound();
  const isMobile = useMobile();

  const getVictoryType = useCallback(() => {
    const recentLogs = gameLog.slice(-10);

    for (const log of recentLogs) {
      const message = log.message;

      if (message.includes("TRIPLE KORA (333)")) {
        return {
          type: "triple_kora",
          title: "TRIPLE KORA ! 🎯",
          description: "Victoire avec 3 cartes 3 consécutives",
          multiplier: "x4",
          special: true,
        };
      }
      if (message.includes("33 Export")) {
        return {
          type: "double_kora",
          title: "DOUBLE KORA ! 🔥",
          description: "Victoire avec 2 cartes 3 consécutives",
          multiplier: "x3",
          special: true,
        };
      }
      if (message.includes("KORA Simple")) {
        return {
          type: "simple_kora",
          title: "KORA ! 🏆",
          description: "Victoire avec un 3 au tour final",
          multiplier: "x2",
          special: true,
        };
      }

      if (message.includes("Victoire automatique")) {
        if (message.includes("Somme < 21")) {
          return {
            type: "auto_sum",
            title: "Victoire Automatique ! ⚡",
            description: "Somme des cartes inférieure à 21",
            multiplier: "x1",
            special: true,
          };
        }
        if (message.includes("Somme la plus faible")) {
          return {
            type: "auto_lowest",
            title: "Victoire Automatique ! 📊",
            description: "Plus petite somme (les deux < 21)",
            multiplier: "x1",
            special: true,
          };
        }
      }
    }

    return {
      type: "normal",
      title: isVictory ? "Victoire ! 🎉" : "Défaite ! 💀",
      description: isVictory
        ? "Vous avez la main au tour final"
        : "L'adversaire a la main au tour final",
      multiplier: "x1",
      special: false,
    };
  }, [gameLog, isVictory]);

  const victoryType = getVictoryType();

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

  const victoryMessages = [
    "🎉 C'est toi le ndoss !",
    "👑 Tu es le grand patron !",
    "🔥 Tu as cassé le morceau !",
    "⚡ Tu es trop fort ndoss !",
    "🎯 Champion absolut !",
    "🔥 Je wanda seulement !",
    "🎯 Tu as le long sense",
  ];

  const defeatMessages = [
    "😅 Tu es un bindi cette fois !",
    "🤦 Pas de chance bindi !",
    "😵 L'IA t'a eu, bindi !",
    "🎭 Retry bindi, tu peux mieux !",
    "💪 Allez bindi, on se relève !",
    "🎭 Quel boa !",
  ];

  const randomMessage = isVictory
    ? victoryMessages[Math.floor(Math.random() * victoryMessages.length)]
    : defeatMessages[Math.floor(Math.random() * defeatMessages.length)];

  return (
    <Sheet open={isVisible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile ? "h-[80vh] rounded-t-xl" : "w-[400px] sm:w-[500px]"
        }
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
              {victoryType.special ? victoryType.description : randomMessage}
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
