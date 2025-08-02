import { type Card, type Suit, type Rank } from "common/deck";
import { AIPlayer } from "@/engine/ai-player";

// Types améliorés pour le game engine
export type PlayerType = "user" | "ai";
export type GameStatus = "waiting" | "playing" | "ended";
export type KoraType = "none" | "simple" | "double" | "triple";
export type AIDifficulty = "easy" | "medium" | "hard";
export type GameMode = "ai" | "online" | "local";

export interface PlayerEntity {
  username: string;
  type: PlayerType;
  isConnected: boolean;
  name?: string;
  avatar?: string;
  hand?: Card[];
  koras: number;
  aiDifficulty?: AIDifficulty;
  isThinking?: boolean;
}

export interface PlayedCard {
  card: Card;
  playerUsername: string;
  round: number;
  timestamp: number;
}

export interface GameAction {
  type: "PLAY_CARD" | "START_GAME" | "END_GAME" | "SYNC_STATE";
  payload: unknown;
  timestamp: number;
  playerUsername?: string;
  actionId: string;
}

export interface GameState {
  gameId: string;
  status: GameStatus;
  maxRounds: number;
  currentRound: number;
  hasHandUsername: string | null;
  playerTurnUsername: string | null;
  players: PlayerEntity[];
  playedCards: PlayedCard[];
  winnerUsername: string | null;
  currentBet: number;
  endReason: string | null;
  gameLog: Array<{ message: string; timestamp: number }>;
  seed: string;
  version: number;
}

export interface GameActions {
  // Actions principales
  startNewGame: () => void;
  playCard: (cardId: string, playerId: string) => boolean;

  // Actions de debug/god mode
  toggleGodMode: () => void;
  forcePlayerHand: (playerId: string) => void;
  setPlayerCards: (cards: Card[], playerId: string) => void;

  // Utilitaires
  getPlayableCards: (playerId: string) => Card[];
  canPlayCard: (cardId: string, playerId: string) => boolean;
  getGameSummary: () => string;
}

export class KoraGameEngine {
  private state: GameState;
  private listeners: ((state: GameState) => void)[] = [];

  constructor(bet: number, maxRounds: number, players: PlayerEntity[]) {
    this.state = this.getInitialState(bet, maxRounds, players);
  }

  private getInitialState(
    bet = 10,
    maxRounds = 5,
    players: PlayerEntity[] = [],
  ): GameState {
    const seed = Date.now().toString();
    return {
      gameId: `game-${seed}`,
      seed,
      version: 0,
      status: "waiting",
      currentRound: 1,
      maxRounds,
      hasHandUsername: null,
      playerTurnUsername: null,
      players,
      playedCards: [],
      currentBet: bet,
      winnerUsername: null,
      endReason: null,
      gameLog: [],
    };
  }

  // ========== CRÉATION ET DISTRIBUTION DES CARTES ==========

  private createDeck(): Card[] {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Rank[] = ["3", "4", "5", "6", "7", "8", "9", "10"];
    const deck: Card[] = [];

    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        if (suit === "spades" && rank === "10") {
          return;
        }

        deck.push({
          suit,
          rank,
          jouable: false,
          id: `${suit}-${rank}-${this.state.seed}-${suits.indexOf(suit) * 8 + ranks.indexOf(rank)}`,
        });
      });
    });

    this.log(
      `🃏 Deck créé avec ${deck.length} cartes (deck incomplet selon les règles)`,
    );
    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
    return shuffled;
  }

  private getCardValue(rank: Rank): number {
    switch (rank) {
      case "10":
        return 10;
      case "9":
        return 9;
      case "8":
        return 8;
      case "7":
        return 7;
      case "6":
        return 6;
      case "5":
        return 5;
      case "4":
        return 4;
      case "3":
        return 3;
      default:
        return parseInt(rank);
    }
  }

  private calculateHandSum(cards: Card[]): number {
    return cards.reduce((sum, card) => sum + this.getCardValue(card.rank), 0);
  }

  private distributeCards(): { firstPlayer: Card[]; secondPlayer: Card[] } {
    const deck = this.createDeck();
    const firstPlayer = deck.slice(0, 5);
    const secondPlayer = deck.slice(5, 10);

    return { firstPlayer, secondPlayer };
  }

  private getStartingPlayer() {
    const firstPlayer = this.state.players[0]!;
    const secondPlayer = this.state.players[1]!;

    return Math.random() < 0.5 ? firstPlayer.username : secondPlayer.username;
  }

  // ========== LOGIQUE DE JEU PRINCIPALE ==========

  public startNewGame(): void {
    // Distribution des cartes
    const { firstPlayer, secondPlayer } = this.distributeCards();
    const startingPlayerId = this.getStartingPlayer();

    this.state = {
      ...this.getInitialState(
        this.state.currentBet,
        this.state.maxRounds,
        this.state.players,
      ),
      players: this.state.players.map((player) => ({
        ...player,
        hand: player.username === startingPlayerId ? firstPlayer : secondPlayer,
      })),
      status: "playing",
      currentRound: 1,
      hasHandUsername: startingPlayerId,
      playerTurnUsername: startingPlayerId,
    };

    // Vérifier les victoires automatiques (somme < 21)
    const firstPlayerSum = this.calculateHandSum(firstPlayer);
    const secondPlayerSum = this.calculateHandSum(secondPlayer);

    if (firstPlayerSum < 21 || secondPlayerSum < 21) {
      if (firstPlayerSum < 21 && secondPlayerSum < 21) {
        // Les deux joueurs ont une somme < 21, celui avec la plus petite gagne
        const winnerId =
          firstPlayerSum < secondPlayerSum
            ? startingPlayerId
            : this.state.players.find((p) => p.username !== startingPlayerId)!
                .username;
        this.handleAutomaticVictory(
          winnerId,
          `Somme la plus faible (${Math.min(firstPlayerSum, secondPlayerSum)})`,
        );
        this.endGame(winnerId);
        return;
      } else if (firstPlayerSum < 21) {
        this.handleAutomaticVictory(
          startingPlayerId,
          `Somme < 21 (${firstPlayerSum})`,
        );
        this.endGame(startingPlayerId);
        return;
      } else {
        const winnerId = this.state.players.find(
          (p) => p.username !== startingPlayerId,
        )!.username;
        this.handleAutomaticVictory(
          winnerId,
          `Somme < 21 (${secondPlayerSum})`,
        );
        this.endGame(winnerId);
        return;
      }
    }

    this.log(
      `🎮 Nouvelle partie commencée ! Joueur ${startingPlayerId} a la main`,
    );
    this.log(`Sommes: J1=${firstPlayerSum}, J2=${secondPlayerSum}`);

    // Mettre à jour les cartes jouables
    this.updatePlayableCards();
    this.notifyListeners();
  }

  public playCard(cardId: string, player: PlayerEntity): boolean {
    if (this.state.status !== "playing") {
      return false;
    }

    // Vérifier si c'est le tour du joueur
    if (!this.isPlayerTurn(player)) {
      return false;
    }

    // Trouver la carte
    const cardIndex = player.hand?.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) {
      return false;
    }

    const card = player.hand![cardIndex!];
    if (!card) {
      return false;
    }

    // Vérifier si la carte est jouable
    if (!card.jouable) {
      return false;
    }

    // Jouer la carte
    const newPlayedCards: PlayedCard[] = [
      ...this.state.playedCards,
      {
        card,
        playerUsername: player.username,
        round: this.state.currentRound,
        timestamp: Date.now(),
      },
    ];

    // Retirer la carte de la main du joueur
    const newPlayerCards = player.hand?.filter((c) => c.id !== cardId);

    this.state = {
      ...this.state,
      players: this.state.players.map((p) =>
        p.username === player.username ? { ...p, hand: newPlayerCards } : p,
      ),
      playedCards: newPlayedCards,
    };

    // Vérifier si le tour est terminé (2 cartes jouées)
    const currentRoundCards = newPlayedCards.filter(
      (p) => p.round === this.state.currentRound,
    );

    if (currentRoundCards.length === 2) {
      this.resolveRound(currentRoundCards);
    }

    // Toujours mettre à jour l'état du tour et les cartes jouables
    this.updatePlayableCards();
    this.notifyListeners();

    // Déclencher automatiquement l'IA si c'est son tour et qu'elle est de type AI
    void this.triggerAIIfNeeded();

    return true;
  }

  // Nouvelle méthode pour déclencher l'IA automatiquement
  private async triggerAIIfNeeded(): Promise<void> {
    if (
      this.state.players.find((p) => p.type === "ai") &&
      this.state.status === "playing"
    ) {
      const currentRoundCards = this.state.playedCards.filter(
        (p) => p.round === this.state.currentRound,
      );

      const isAITurn = (() => {
        if (currentRoundCards.length === 0) {
          return this.state.hasHandUsername === this.state.players[1]!.username;
        } else if (currentRoundCards.length === 1) {
          const firstPlayer = currentRoundCards[0]!.playerUsername;
          return firstPlayer !== this.state.players[1]!.username;
        } else {
          return false;
        }
      })();

      if (
        isAITurn &&
        !this.state.players.find((p) => p.type === "ai")!.isThinking
      ) {
        setTimeout(() => {
          void this.triggerAITurn(
            this.state.players.find((p) => p.type === "ai")!,
          );
        }, 100);
      }
    }
  }

  private resolveRound(
    roundCards: { card: Card; playerUsername: string; round: number }[],
  ): void {
    if (roundCards.length < 2) return;
    const [firstCard, secondCard] = roundCards;
    if (!firstCard || !secondCard) return;

    // Déterminer qui gagne le tour
    let winnerId: string;

    if (firstCard.card.suit === secondCard.card.suit) {
      // Même famille : comparer les valeurs
      const firstValue = this.getCardValue(firstCard.card.rank);
      const secondValue = this.getCardValue(secondCard.card.rank);

      winnerId =
        secondValue > firstValue
          ? secondCard.playerUsername
          : firstCard.playerUsername;
    } else {
      // Familles différentes : celui qui avait la main garde la main
      winnerId = this.state.hasHandUsername!;
    }

    // Vérifier les exploits Kora (3 au tour 5)
    if (this.state.currentRound === 5) {
      this.checkKoraExploits(roundCards, winnerId);
    }

    // Mettre à jour l'état
    this.state.hasHandUsername = winnerId;

    // Passer au tour suivant ou terminer la partie
    if (
      this.state.currentRound >= 5 ||
      this.state.players.find((p) => p.username === winnerId)?.hand?.length ===
        0
    ) {
      this.endGame(winnerId);
    } else {
      this.state.currentRound++;
    }
  }

  private checkKoraExploits(
    roundCards: { card: Card; playerUsername: string; round: number }[],
    winnerId: string,
  ): void {
    const winnerCard = roundCards.find(
      (rc) => rc.playerUsername === winnerId,
    )?.card;

    if (winnerCard && winnerCard.rank === "3") {
      // Kora simple au tour 5

      // Vérifier les exploits multiples (33, 333)
      const playerPlayedCards = this.state.playedCards
        .filter((pc) => pc.playerUsername === winnerId)
        .map((pc) => pc.card.rank);

      const consecutiveThrees = this.countConsecutiveThrees(playerPlayedCards);

      if (consecutiveThrees >= 3) {
        this.log(`🎯 TRIPLE KORA (333) ! Multiplicateur x4 !`);
        this.applyKoraMultiplier(winnerId, 4);
      } else if (consecutiveThrees >= 2) {
        this.log(`🔥 DOUBLE KORA (33) ! Multiplicateur x3 !`);
        this.applyKoraMultiplier(winnerId, 3);
      } else {
        this.log(`🏆 KORA Simple ! Multiplicateur x2 !`);
        this.applyKoraMultiplier(winnerId, 2);
      }
    }
  }

  private countConsecutiveThrees(ranks: string[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const rank of ranks) {
      if (rank === "3") {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private applyKoraMultiplier(winnerId: string, multiplier: number): void {
    const betAmount = this.state.currentBet;
    const korasWon = betAmount * multiplier;

    if (winnerId === this.state.hasHandUsername) {
      this.state.players.find((p) => p.username === winnerId)!.koras +=
        korasWon;
      this.state.players.find((p) => p.username !== winnerId)!.koras -=
        betAmount; // L'adversaire perd la mise de base
    } else {
      this.state.players.find((p) => p.username === winnerId)!.koras +=
        korasWon;
      this.state.players.find((p) => p.username !== winnerId)!.koras -=
        betAmount;
    }
  }

  private endGame(winnerId: string): void {
    this.state.status = "ended";
    this.state.winnerUsername = winnerId;

    // Gérer les gains/pertes de koras pour une partie normale
    const betAmount = this.state.currentBet;

    if (winnerId === this.state.hasHandUsername) {
      this.state.players.find((p) => p.username === winnerId)!.koras +=
        betAmount;
      this.state.players.find((p) => p.username !== winnerId)!.koras -=
        betAmount;
    } else {
      this.state.players.find((p) => p.username === winnerId)!.koras +=
        betAmount;
      this.state.players.find((p) => p.username === winnerId)!.koras -=
        betAmount;
    }
  }

  // ========== GESTION DES CARTES JOUABLES ==========

  private updatePlayableCards(): void {
    this.updatePlayerTurn();
    this.state.players.forEach((player) => {
      player.hand = player.hand?.map((card) => ({
        ...card,
        jouable: this.canPlayCard(card.id, player),
      }));
    });
  }

  public canPlayCard(cardId: string, player: PlayerEntity): boolean {
    if (this.state.status !== "playing") return false;
    if (!this.isPlayerTurn(player)) return false;

    const card = player.hand?.find((c) => c.id === cardId);
    if (!card) return false;

    // Si le joueur a la main, toutes ses cartes sont jouables
    if (this.state.hasHandUsername === player.username) {
      return true;
    }

    // Si pas de carte jouée ce tour, toutes les cartes sont jouables
    if (!this.state.playedCards.length) {
      return true;
    }

    // Vérifier si c'est en réponse à une carte de ce tour
    const currentRoundCards = this.state.playedCards.filter(
      (p) => p.round === this.state.currentRound,
    );
    if (currentRoundCards.length === 0) {
      return true;
    }

    const firstRoundCard = currentRoundCards[0];
    if (!firstRoundCard) return true;
    const opponentCard = firstRoundCard.card;

    // Vérifier si le joueur a des cartes de la même famille
    const requiredSuit = opponentCard.suit;
    const hasRequiredSuit = player.hand?.some((c) => c.suit === requiredSuit);

    if (hasRequiredSuit) {
      // Doit jouer la même famille
      return card.suit === requiredSuit;
    } else {
      // Peut jouer n'importe quelle carte
      return true;
    }
  }

  public getPlayableCards(player: PlayerEntity): Card[] {
    return player.hand?.filter((card) => card.jouable) ?? [];
  }

  // ========== UTILITAIRES ==========

  private isPlayerTurn(player: PlayerEntity): boolean {
    // Utiliser directement playerTurnUsername qui est mis à jour par updatePlayerTurn()
    return this.state.playerTurnUsername === player.username;
  }

  private updatePlayerTurn(): void {
    const currentRoundCards = this.state.playedCards.filter(
      (p) => p.round === this.state.currentRound,
    );

    if (currentRoundCards.length === 0) {
      // Aucune carte jouée ce tour : c'est à celui qui a la main
      this.state.playerTurnUsername = this.state.hasHandUsername;
    } else if (currentRoundCards.length === 1) {
      // Une carte jouée : c'est à l'autre joueur
      const firstPlayerUsername = currentRoundCards[0]!.playerUsername;
      const otherPlayer = this.state.players.find(
        (p) => p.username !== firstPlayerUsername,
      );
      this.state.playerTurnUsername = otherPlayer?.username ?? null;
    } else {
      // Deux cartes jouées : tour terminé, préparer le prochain
      this.state.playerTurnUsername = null;
    }
  }

  private getSuitSymbol(suit: Suit): string {
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
  }

  private log(message: string): void {
    const timestamp = Date.now();
    const logEntry = { message, timestamp };
    this.state.gameLog.push(logEntry);
    console.log(`[${new Date(timestamp).toLocaleTimeString()}] ${message}`);
  }

  // ========== VALIDATION DES ACTIONS ==========

  public validateAction(action: GameAction): {
    valid: boolean;
    error?: string;
  } {
    switch (action.type) {
      case "PLAY_CARD":
        return this.validatePlayCardAction(action.payload);
      case "START_GAME":
        return this.validateStartGameAction();
      default:
        return { valid: false, error: "Action non reconnue" };
    }
  }

  private validatePlayCardAction(payload: unknown): {
    valid: boolean;
    error?: string;
  } {
    if (
      !payload ||
      typeof payload !== "object" ||
      !("cardId" in payload) ||
      !("player" in payload) ||
      typeof payload.cardId !== "string" ||
      typeof payload.player !== "string"
    ) {
      return { valid: false, error: "Payload invalide pour jouer une carte" };
    }

    const { cardId, player } = payload as { cardId: string; player: string };

    if (player !== "player" && player !== "opponent") {
      return { valid: false, error: "Joueur invalide" };
    }

    const typedPlayer = this.state.players.find((p) => p.username === player);

    if (this.state.status !== "playing") {
      return { valid: false, error: "La partie n'est pas en cours" };
    }

    if (!this.isPlayerTurn(typedPlayer!)) {
      return { valid: false, error: "Ce n'est pas le tour de ce joueur" };
    }

    const card = typedPlayer?.hand?.find((c) => c.id === cardId);

    if (!card) {
      return { valid: false, error: "Carte non trouvée" };
    }

    if (!this.canPlayCard(cardId, typedPlayer!)) {
      return { valid: false, error: "Cette carte n'est pas jouable" };
    }

    return { valid: true };
  }

  private validateStartGameAction(): { valid: boolean; error?: string } {
    if (this.state.status === "playing") {
      return { valid: false, error: "Une partie est déjà en cours" };
    }
    return { valid: true };
  }

  // ========== INTERFACE PUBLIQUE ==========

  public getState(): GameState {
    return { ...this.state };
  }

  public subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  public getGameSummary(): string {
    const state = this.state;
    return `
🎮 État du Jeu Kora Battle
═══════════════════════════
Status: ${state.status}
Tour: ${state.currentRound}/5
Main: ${state.hasHandUsername === state.players[0]!.username ? "Joueur" : "Adversaire"}
Cartes Joueur: ${state.players[0]!.hand?.length}
Cartes Adversaire: ${state.players[1]!.hand?.length}
Koras Joueur: ${state.players[0]!.koras}
Koras Adversaire: ${state.players[1]!.koras}
═══════════════════════════
    `.trim();
  }

  // ========== CAS SPÉCIAUX ET VICTOIRES AUTOMATIQUES ==========

  private handleAutomaticVictory(winnerId: string, reason: string): void {
    // Victoire automatique donne la mise de base
    const betAmount = this.state.currentBet;

    if (winnerId === this.state.hasHandUsername) {
      this.state.players.find((p) => p.username === winnerId)!.koras +=
        betAmount;
      this.state.players.find((p) => p.username !== winnerId)!.koras -=
        betAmount;
      this.log(`🏆 Victoire automatique ! ${reason}`);
    } else {
      this.state.players.find((p) => p.username !== winnerId)!.koras +=
        betAmount;
      this.state.players.find((p) => p.username === winnerId)!.koras -=
        betAmount;
      this.log(`💀 Défaite automatique ! ${reason}`);
    }
  }

  // ========== ANALYSE DES VICTOIRES SPÉCIALES ==========

  public getVictoryType(): {
    type:
      | "normal"
      | "auto_sum"
      | "auto_lowest"
      | "simple_kora"
      | "double_kora"
      | "triple_kora";
    title: string;
    description: string;
    multiplier: string;
    special: boolean;
  } {
    const recentLogs = this.state.gameLog.slice(-10);

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
      if (message.includes("DOUBLE KORA (33)")) {
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
      title: this.state.winnerUsername ? "Victoire ! 🎉" : "Défaite ! 💀",
      description: this.state.winnerUsername
        ? "Vous avez la main au tour final"
        : "L'adversaire a la main au tour final",
      multiplier: "x1",
      special: false,
    };
  }

  public getKorasWonThisGame(): number {
    const betAmount = this.state.currentBet;
    const victoryType = this.getVictoryType();

    if (!this.state.winnerUsername) return 0;

    switch (victoryType.type) {
      case "triple_kora":
        return betAmount * 4;
      case "double_kora":
        return betAmount * 3;
      case "simple_kora":
        return betAmount * 2;
      default:
        return betAmount;
    }
  }

  public setAIDifficulty(difficulty: AIDifficulty): void {
    this.state.players.find((p) => p.type === "ai")!.aiDifficulty = difficulty;
    this.notifyListeners();
  }

  public async triggerAITurn(aiPlayer: PlayerEntity): Promise<void> {
    if (this.state.status !== "playing") {
      return;
    }

    // Vérifier si c'est le tour de l'IA
    const currentRoundCards = this.state.playedCards.filter(
      (p) => p.round === this.state.currentRound,
    );

    const isAITurn = (() => {
      if (currentRoundCards.length === 0) {
        return this.state.hasHandUsername === aiPlayer.username;
      } else if (currentRoundCards.length === 1) {
        const firstPlayer = currentRoundCards[0]!.playerUsername;
        return firstPlayer !== aiPlayer.username;
      } else {
        return false; // Deux cartes jouées, tour terminé
      }
    })();

    if (
      !isAITurn ||
      this.state.players.find((p) => p.type === "ai")!.isThinking
    ) {
      return;
    }

    // Marquer l'IA comme en réflexion
    this.state.players.find((p) => p.type === "ai")!.isThinking = true;
    this.notifyListeners();

    // Délai de réflexion basé sur la difficulté
    const thinkingTime =
      this.state.players.find((p) => p.type === "ai")!.aiDifficulty === "easy"
        ? 500
        : this.state.players.find((p) => p.type === "ai")!.aiDifficulty ===
            "medium"
          ? 1000
          : 1500;

    await new Promise((resolve) => setTimeout(resolve, thinkingTime));

    // L'IA choisit sa carte en utilisant la logique du AIPlayer
    let chosenCard: string | null = null;

    // Importer et utiliser AIPlayer
    try {
      const aiInstance = new AIPlayer(aiPlayer.aiDifficulty ?? "medium");
      const selectedCard = aiInstance.chooseCard(this.getState());
      chosenCard = selectedCard?.id ?? null;
    } catch (error) {
      console.warn("Erreur lors du chargement de l'IA:", error);
    }

    // Fallback: choisir une carte jouable aléatoire
    if (!chosenCard && aiPlayer.hand) {
      const playableCards = aiPlayer.hand.filter((card) => card.jouable);
      if (playableCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * playableCards.length);
        chosenCard = playableCards[randomIndex]!.id;
      }
    }

    if (chosenCard) {
      this.playCard(chosenCard, aiPlayer);
    }

    // Marquer l'IA comme ayant fini de réfléchir
    this.state.players.find((p) => p.type === "ai")!.isThinking = false;
    this.notifyListeners();
  }
}

// Instance singleton du game engine
let gameEngineInstance: KoraGameEngine | null = null;

export const createKoraGameEngine = (
  bet: number,
  maxRounds: number,
  players: PlayerEntity[],
) => {
  gameEngineInstance = new KoraGameEngine(bet, maxRounds, players);
  return gameEngineInstance;
};

export const getKoraGameEngine = (): KoraGameEngine => {
  if (!gameEngineInstance) {
    throw new Error(
      "L'engine de jeu n'est pas initialisé. Appeler createKoraGameEngine d'abord.",
    );
  }
  return gameEngineInstance;
};
