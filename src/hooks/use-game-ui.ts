"use client";

import { useState, useCallback } from "react";
import { type AIDifficulty } from "@/engine/kora-game-engine";
import { type GameMode } from "@prisma/client";

interface GameUI {
  // États de l'interface
  selectedGameMode: GameMode | null;
  aiDifficulty: AIDifficulty;
  hoveredCard: number | null;
  showVictoryModal: boolean;
  showReviewSheet: boolean;

  // Actions
  actions: {
    setSelectedGameMode: (mode: GameMode | null) => void;
    setAIDifficulty: (difficulty: AIDifficulty) => void;
    setHoveredCard: (cardIndex: number | null) => void;
    showVictory: () => void;
    hideVictory: () => void;
    showReview: () => void;
    hideReview: () => void;
    setGameMode: (mode: GameMode) => void;
  };
}

export function useGameUI(): GameUI {
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(
    null,
  );
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>("medium");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showReviewSheet, setShowReviewSheet] = useState(false);

  const actions = {
    setSelectedGameMode: useCallback((mode: GameMode | null) => {
      setSelectedGameMode(mode);
    }, []),

    setAIDifficulty: useCallback((difficulty: AIDifficulty) => {
      setAIDifficulty(difficulty);
    }, []),

    setHoveredCard: useCallback((cardIndex: number | null) => {
      setHoveredCard(cardIndex);
    }, []),

    showVictory: useCallback(() => {
      setShowVictoryModal(true);
    }, []),

    hideVictory: useCallback(() => {
      setShowVictoryModal(false);
    }, []),

    showReview: useCallback(() => {
      setShowReviewSheet(true);
    }, []),

    hideReview: useCallback(() => {
      setShowReviewSheet(false);
    }, []),

    setGameMode: useCallback((mode: GameMode) => {
      setSelectedGameMode(mode);
    }, []),
  };

  return {
    selectedGameMode,
    aiDifficulty,
    hoveredCard,
    showVictoryModal,
    showReviewSheet,
    actions,
  };
}
