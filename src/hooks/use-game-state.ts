import { useState, useCallback } from "react";
import { type Card } from "common/deck";

export type GamePhase = "waiting" | "playing" | "ended" | "victory" | "defeat";
export type PlayerTurn = "player" | "opponent";

interface GameState {
  phase: GamePhase;
  currentTurn: PlayerTurn;
  playerCards: Card[];
  opponentCards: Card[];
  playedCards: Card[];
  playableCards: number[];
  hoveredCard: number | null;
  selectedCard: number | null;
  isAnimating: boolean;
}

interface GameActions {
  startGame: () => void;
  playCard: (cardIndex: number) => void;
  setHoveredCard: (cardIndex: number | null) => void;
  selectCard: (cardIndex: number | null) => void;
  playSelectedCard: () => void;
  switchTurn: () => void;
  endGame: () => void;
  setVictory: () => void;
  setDefeat: () => void;
  // Actions pour le debug
  setPhase: (phase: GamePhase) => void;
  setCurrentTurn: (turn: PlayerTurn) => void;
  setPlayableCards: (cards: number[]) => void;
  playRandomCard: () => void;
}

export function useGameState(): GameState & GameActions {
  const [gameState, setGameState] = useState<GameState>({
    phase: "waiting",
    currentTurn: "player",
    playerCards: [
      { suit: "hearts", rank: "K", jouable: false, id: "0" },
      { suit: "diamonds", rank: "Q", jouable: false, id: "1" },
      { suit: "clubs", rank: "J", jouable: false, id: "2" },
      { suit: "spades", rank: "A", jouable: false, id: "3" },
      { suit: "hearts", rank: "10", jouable: false, id: "4" },
    ],
    opponentCards: [
      { suit: "hearts", rank: "A", jouable: false, id: "10" },
      { suit: "diamonds", rank: "K", jouable: false, id: "5" },
      { suit: "clubs", rank: "Q", jouable: false, id: "6" },
      { suit: "spades", rank: "J", jouable: false, id: "7" },
      { suit: "hearts", rank: "9", jouable: false, id: "8" },
      { suit: "diamonds", rank: "8", jouable: false, id: "9" },
    ],
    playedCards: [],
    playableCards: [],
    hoveredCard: null,
    selectedCard: null,
    isAnimating: false,
  });

  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "playing",
      currentTurn: "player",
      playableCards: prev.playerCards.map((_, index) => index), // Toutes les cartes sont jouables au début
    }));
  }, []);

  const playCard = useCallback(
    (cardIndex: number) => {
      if (gameState.isAnimating || gameState.phase !== "playing") return;

      setGameState((prev) => {
        const card = prev.playerCards[cardIndex];
        if (!card) return prev;

        // Animation en cours
        const newState = { ...prev, isAnimating: true };

        // Après un délai pour l'animation
        setTimeout(() => {
          setGameState((current) => ({
            ...current,
            playerCards: current.playerCards.filter((_, i) => i !== cardIndex),
            playedCards: [...current.playedCards, card],
            isAnimating: false,
            currentTurn: "opponent",
            playableCards: [], // Pas de cartes jouables pendant le tour de l'adversaire
          }));

          // Simuler le tour de l'adversaire après 2 secondes
          setTimeout(() => {
            setGameState((opponent) => {
              if (opponent.opponentCards.length === 0) {
                return { ...opponent, phase: "ended" };
              }

              const randomIndex = Math.floor(
                Math.random() * opponent.opponentCards.length,
              );
              const opponentCard = opponent.opponentCards[randomIndex];

              if (!opponentCard) return opponent;

              return {
                ...opponent,
                opponentCards: opponent.opponentCards.filter(
                  (_, i) => i !== randomIndex,
                ),
                playedCards: [...opponent.playedCards, opponentCard],
                currentTurn: "player",
                playableCards: opponent.playerCards.map((_, index) => index), // Toutes les cartes redeviennent jouables
              };
            });
          }, 2000);
        }, 800);

        return newState;
      });
    },
    [gameState.isAnimating, gameState.phase],
  );

  const setHoveredCard = useCallback(
    (cardIndex: number | null) => {
      if (!gameState.isAnimating) {
        setGameState((prev) => ({ ...prev, hoveredCard: cardIndex }));
      }
    },
    [gameState.isAnimating],
  );

  const switchTurn = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentTurn: prev.currentTurn === "player" ? "opponent" : "player",
      playableCards:
        prev.currentTurn === "opponent"
          ? prev.playerCards.map((_, index) => index)
          : [],
    }));
  }, []);

  const endGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "ended",
      playableCards: [],
      hoveredCard: null,
    }));
  }, []);

  const setVictory = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "victory",
      playableCards: [],
      hoveredCard: null,
      selectedCard: null,
    }));
  }, []);

  const setDefeat = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "defeat",
      playableCards: [],
      hoveredCard: null,
      selectedCard: null,
    }));
  }, []);

  // Actions pour le debug
  const setPhase = useCallback((phase: GamePhase) => {
    setGameState((prev) => ({ ...prev, phase }));
  }, []);

  const setCurrentTurn = useCallback((turn: PlayerTurn) => {
    setGameState((prev) => ({ ...prev, currentTurn: turn }));
  }, []);

  const setPlayableCards = useCallback((cards: number[]) => {
    setGameState((prev) => ({ ...prev, playableCards: cards }));
  }, []);

  const selectCard = useCallback((cardIndex: number | null) => {
    setGameState((prev) => ({
      ...prev,
      selectedCard: prev.selectedCard === cardIndex ? null : cardIndex,
    }));
  }, []);

  const playSelectedCard = useCallback(() => {
    if (gameState.selectedCard !== null) {
      playCard(gameState.selectedCard);
      setGameState((prev) => ({ ...prev, selectedCard: null }));
    }
  }, [gameState.selectedCard, playCard]);

  const playRandomCard = useCallback(() => {
    if (gameState.playableCards.length > 0 && !gameState.isAnimating) {
      const randomIndex =
        gameState.playableCards[
          Math.floor(Math.random() * gameState.playableCards.length)
        ];
      if (randomIndex !== undefined) {
        playCard(randomIndex);
      }
    }
  }, [gameState.playableCards, gameState.isAnimating, playCard]);

  return {
    ...gameState,
    startGame,
    playCard,
    setHoveredCard,
    selectCard,
    playSelectedCard,
    switchTurn,
    endGame,
    setVictory,
    setDefeat,
    setPhase,
    setCurrentTurn,
    setPlayableCards,
    playRandomCard,
  };
}
