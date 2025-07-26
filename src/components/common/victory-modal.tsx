"use client";

import { LibButton } from "@/components/library/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconTrophy,
  IconSkull,
  IconRefresh,
  IconCoins,
  IconHistory,
  IconPlayerPlay,
} from "@tabler/icons-react";

interface VictoryModalProps {
  isVisible: boolean;
  isVictory: boolean;
  playerKoras: number;
  opponentKoras: number;
  betAmount: number;
  korasWon: number;
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
  onPlayAgain,
  onClose,
  onViewHistory,
  onEnterReview,
}: VictoryModalProps) {
  if (!isVisible) return null;

  const victoryMessages = [
    "🎉 C'est toi le ndoss !",
    "👑 Tu es le grand patron !",
    "🔥 Tu as cassé le morceau !",
    "⚡ Tu es trop fort ndoss !",
    "🎯 Champion absolut !",
  ];

  const defeatMessages = [
    "😅 Tu es un bindi cette fois !",
    "🤦 Pas de chance bindi !",
    "😵 L'IA t'a eu, bindi !",
    "🎭 Retry bindi, tu peux mieux !",
    "💪 Allez bindi, on se relève !",
  ];

  const randomMessage = isVictory
    ? victoryMessages[Math.floor(Math.random() * victoryMessages.length)]
    : defeatMessages[Math.floor(Math.random() * defeatMessages.length)];

  return (
    <div className="animate-in fade-in bg-background/80 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm duration-500">
      <Card
        className={`card-game-effect mx-4 w-full max-w-md ${
          isVictory ? "border-primary/50" : "border-destructive/50"
        } shadow-2xl`}
      >
        <CardContent className="space-y-6 p-8 text-center">
          {/* Icône principale */}
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

          {/* Message principal */}
          <div>
            <h2
              className={`mb-2 text-3xl font-bold ${
                isVictory ? "text-primary" : "text-destructive"
              }`}
            >
              {isVictory ? "VICTOIRE !" : "DÉFAITE !"}
            </h2>
            <p className="text-foreground text-lg font-medium">
              {randomMessage}
            </p>
          </div>

          {/* Informations des mises */}
          <div className="space-y-4">
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
          </div>

          {/* Boutons d'action */}
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
        </CardContent>
      </Card>
    </div>
  );
}
