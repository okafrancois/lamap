"use client";

import { LibButton } from "@/components/library/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconTrophy,
  IconSkull,
  IconRefresh,
  IconCoins,
  IconHistory,
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
    <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm duration-500">
      <Card
        className={`mx-4 w-full max-w-md ${
          isVictory
            ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-amber-500/20"
            : "border-red-500/50 bg-gradient-to-br from-red-500/20 to-rose-500/20"
        } shadow-2xl`}
      >
        <CardContent className="space-y-6 p-8 text-center">
          {/* Icône principale */}
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              isVictory
                ? "bg-yellow-500 shadow-lg shadow-yellow-500/50"
                : "bg-red-500 shadow-lg shadow-red-500/50"
            }`}
          >
            {isVictory ? (
              <IconTrophy className="size-10 text-white" />
            ) : (
              <IconSkull className="size-10 text-white" />
            )}
          </div>

          {/* Message principal */}
          <div>
            <h2
              className={`mb-2 text-3xl font-bold ${
                isVictory ? "text-yellow-200" : "text-red-200"
              }`}
            >
              {isVictory ? "VICTOIRE !" : "DÉFAITE !"}
            </h2>
            <p
              className={`text-lg font-medium ${
                isVictory ? "text-yellow-100" : "text-red-100"
              }`}
            >
              {randomMessage}
            </p>
          </div>

          {/* Informations des mises */}
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg bg-black/20 p-4">
              <div className="flex items-center justify-center gap-2 text-white">
                <IconCoins className="size-5" />
                <span className="font-semibold">Résumé de la partie</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-white/70">Mise engagée</div>
                  <div className="text-lg font-bold text-white">
                    {betAmount} koras
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white/70">
                    {isVictory ? "Koras gagnés" : "Koras perdus"}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isVictory ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isVictory ? "+" : "-"}
                    {korasWon} koras
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-white/70">Vos koras</div>
                    <div className="text-lg font-bold text-blue-400">
                      {playerKoras}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/70">IA koras</div>
                    <div className="text-lg font-bold text-red-400">
                      {opponentKoras}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            {onViewHistory && (
              <LibButton
                onClick={onViewHistory}
                variant="outline"
                className="w-full border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                icon={<IconHistory className="size-4" />}
              >
                📊 Voir l'historique de la partie
              </LibButton>
            )}
            <div className="flex gap-3">
              <LibButton
                onClick={onPlayAgain}
                className={`flex-1 ${
                  isVictory
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                icon={<IconRefresh className="size-4" />}
              >
                Rejouer
              </LibButton>
              <LibButton
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
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
