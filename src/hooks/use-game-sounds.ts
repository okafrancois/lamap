"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/hooks/use-sound";
import { type Game } from "@/engine/kora-game-engine";
import { useUserDataContext } from "@/components/layout/user-provider";

export function useGameSounds(gameState: Game | null) {
  const { playSound } = useSound();
  const userData = useUserDataContext();
  const previousGameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!gameState || !userData) return;

    const previousState = previousGameRef.current;

    // Première fois - pas de sons à jouer
    if (!previousState) {
      previousGameRef.current = gameState;
      return;
    }

    // Détecter si une carte a été jouée
    const newPlayedCards = gameState.playedCards.filter(
      (card) =>
        !previousState.playedCards.some(
          (prevCard) => prevCard.card.id === card.card.id,
        ),
    );

    // Jouer les sons pour les nouvelles cartes
    newPlayedCards.forEach((playedCard) => {
      // Ne pas jouer de son pour ses propres cartes (déjà géré ailleurs)
      if (playedCard.playerUsername !== userData.user.username) {
        // Son pour l'adversaire/IA
        void playSound("card_play");

        // Son spécial si c'est un changement de tour
        const currentRoundCards = gameState.playedCards.filter(
          (p) => p.round === gameState.currentRound,
        );

        if (currentRoundCards.length === 2) {
          // Tour terminé, changement de main possible
          setTimeout(() => {
            void playSound("turn_change");
          }, 500);
        }
      }
    });

    // Détecter changement de tour/round
    if (previousState.currentRound !== gameState.currentRound) {
      setTimeout(() => {
        void playSound("turn_change");
      }, 200);
    }

    // Détecter début de réflexion IA
    const aiPlayer = gameState.players.find((p) => p.type === "ai");
    const prevAiPlayer = previousState.players.find((p) => p.type === "ai");

    if (aiPlayer?.isThinking && !prevAiPlayer?.isThinking) {
      void playSound("ai_thinking");
    }

    // Mettre à jour la référence
    previousGameRef.current = gameState;
  }, [gameState, playSound, userData]);

  // Nettoyer la référence quand le composant se démonte
  useEffect(() => {
    return () => {
      previousGameRef.current = null;
    };
  }, []);
}
