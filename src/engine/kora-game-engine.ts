import { type Card, type Suit, type Rank } from "common/deck";
import { AIPlayer } from "@/engine/ai-player";
import { GameStatus, type Game as PrismaGame } from "@prisma/client";

// Types améliorés pour le game engine
export type PlayerType = "user" | "ai";
export type KoraType = "none" | "simple" | "double" | "triple";
export type AIDifficulty = "easy" | "medium" | "hard";

export type GameConfig = Pick<
  Game,
  | "mode"
  | "maxRounds"
  | "aiDifficulty"
  | "currentBet"
  | "isPrivate"
  | "joinCode"
  | "roomName"
  | "maxPlayers"
  | "players"
  | "hostUsername"
>;

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

export interface Game extends Omit<PrismaGame, "players" | "playedCards"> {
  players: PlayerEntity[];
  playedCards: PlayedCard[];
  actions: GameAction[];
  gameLog: Array<{ message: string; timestamp: number }>;
}

export interface GameActions {
  getAiUsername: (difficulty: AIDifficulty) => string;
  // Actions principales
  startNewGame: () => void;
  createNewGame: (gameConfig: GameConfig) => void;
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
  private state: Game;
  private listeners: ((state: Game) => void)[] = [];
  private onVictoryCallback?: () => void;
  private onGameUpdateCallback?: (gameState: Game) => void;

  constructor(gameData: Game) {
    this.state = {
      ...gameData,
      gameLog: gameData.gameLog || [],
    };
  }

  private getInitialState(gameConfig: GameConfig): Game {
    const seed = crypto.randomUUID();
    const players = [...gameConfig.players];

    if (gameConfig.mode === "AI") {
      players.push({
        username: this.getAiUsername(gameConfig.aiDifficulty as AIDifficulty),
        type: "ai",
        isConnected: true,
        koras: 0,
      });
    }
    return {
      gameId: `game-${seed}`,
      seed,
      version: 0,
      status: GameStatus.WAITING,
      currentRound: 1,
      maxRounds: gameConfig.maxRounds ?? 5,
      hasHandUsername: null,
      playerTurnUsername: null,
      players: players,
      playedCards: [],
      currentBet: gameConfig.currentBet ?? 100,
      winnerUsername: null,
      endReason: null,
      gameLog: [],
      actions: [],
      mode: gameConfig.mode,
      maxPlayers: gameConfig.maxPlayers ?? 2,
      aiDifficulty:
        gameConfig.mode === "AI" ? (gameConfig.aiDifficulty ?? "medium") : null,
      roomName: gameConfig.roomName,
      isPrivate: gameConfig.isPrivate,
      hostUsername: gameConfig.hostUsername,
      joinCode: gameConfig.joinCode,
      startedAt: new Date(),
      endedAt: null,
      lastSyncedAt: new Date(),
      victoryType: null,
    };
  }

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

  public createNewGame(gameConfig: GameConfig): void {
    this.state = this.getInitialState(gameConfig);
    this.notifyListeners();
  }

  public startGame(): void {
    // Distribution des cartes
    const { firstPlayer, secondPlayer } = this.distributeCards();
    const startingPlayerId = this.getStartingPlayer();

    this.state = {
      ...this.state,
      players: this.state.players.map((player) => ({
        ...player,
        hand: player.username === startingPlayerId ? firstPlayer : secondPlayer,
      })),
      status: GameStatus.PLAYING,
      currentRound: 1,
      hasHandUsername: startingPlayerId,
      playerTurnUsername: startingPlayerId,
    };

    // Vérifier les victoires automatiques spéciales (3 cartes de 7)
    const firstPlayerSevens = firstPlayer.filter(
      (card) => card.rank === "7",
    ).length;
    const secondPlayerSevens = secondPlayer.filter(
      (card) => card.rank === "7",
    ).length;

    if (firstPlayerSevens >= 3 || secondPlayerSevens >= 3) {
      if (firstPlayerSevens >= 3 && secondPlayerSevens >= 3) {
        // Les deux joueurs ont au moins 3 cartes de 7, celui avec le plus gagne
        const winnerId =
          firstPlayerSevens > secondPlayerSevens
            ? startingPlayerId
            : firstPlayerSevens < secondPlayerSevens
              ? this.state.players.find((p) => p.username !== startingPlayerId)!
                  .username
              : startingPlayerId; // Égalité : le premier joueur gagne
        this.handleAutomaticVictory(
          winnerId,
          `Victoire avec ${Math.max(firstPlayerSevens, secondPlayerSevens)} cartes de 7`,
        );
        this.endGame(winnerId);
        return;
      } else if (firstPlayerSevens >= 3) {
        this.handleAutomaticVictory(
          startingPlayerId,
          `Victoire avec ${firstPlayerSevens} cartes de 7`,
        );
        this.endGame(startingPlayerId);
        return;
      } else {
        const winnerId = this.state.players.find(
          (p) => p.username !== startingPlayerId,
        )!.username;
        this.handleAutomaticVictory(
          winnerId,
          `Victoire avec ${secondPlayerSevens} cartes de 7`,
        );
        this.endGame(winnerId);
        return;
      }
    }

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

    // Sauvegarder l'état initial
  }

  public playCard(cardId: string, player: PlayerEntity): boolean {
    if (this.state.status !== GameStatus.PLAYING) {
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

    // Protection contre les double-jeux : vérifier que cette carte n'a pas déjà été jouée ce tour
    const roundCards = this.state.playedCards.filter(
      (p) => p.round === this.state.currentRound,
    );
    const cardAlreadyPlayed = roundCards.some(
      (playedCard) =>
        playedCard.card.id === cardId &&
        playedCard.playerUsername === player.username,
    );

    if (cardAlreadyPlayed) {
      console.warn("Card already played this round:", cardId);
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

    // Déclencher la synchronisation automatique
    if (this.onGameUpdateCallback) {
      this.onGameUpdateCallback(this.state);
    }

    // Déclencher automatiquement l'IA si c'est son tour et qu'elle est de type AI
    void this.triggerAIIfNeeded();

    return true;
  }

  // Nouvelle méthode pour déclencher l'IA automatiquement
  private async triggerAIIfNeeded(): Promise<void> {
    if (
      this.state.players.find((p) => p.type === "ai") &&
      this.state.status === GameStatus.PLAYING
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
    if (!this.state) {
      console.warn(
        "Cannot apply kora multiplier: engine state not initialized",
      );
      return;
    }

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
    if (!this.state) {
      console.warn("Cannot end game: engine state not initialized");
      return;
    }

    this.state.status = GameStatus.ENDED;
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
      this.state.players.find((p) => p.username !== winnerId)!.koras -=
        betAmount;
    }

    this.notifyListeners();

    // Sauvegarder la fin de partie

    // Déclencher le callback de victoire si défini
    if (this.onVictoryCallback) {
      setTimeout(() => this.onVictoryCallback?.(), 100);
    }
  }

  // ========== GESTION DES CARTES JOUABLES ==========

  private updatePlayableCards(): void {
    if (!this.state) {
      console.warn(
        "Cannot update playable cards: engine state not initialized",
      );
      return;
    }

    this.updatePlayerTurn();
    this.state.players.forEach((player) => {
      player.hand = player.hand?.map((card) => ({
        ...card,
        jouable: this.canPlayCard(card.id, player),
      }));
    });
  }

  public canPlayCard(cardId: string, player: PlayerEntity): boolean {
    if (this.state.status !== GameStatus.PLAYING) return false;
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
    if (!this.state) {
      return false;
    }
    // Utiliser directement playerTurnUsername qui est mis à jour par updatePlayerTurn()
    return this.state.playerTurnUsername === player.username;
  }

  private updatePlayerTurn(): void {
    if (!this.state) {
      return;
    }

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
    if (!this.state) {
      console.warn("Cannot log message: engine state not initialized");
      return;
    }

    if (!this.state.gameLog) {
      this.state.gameLog = [];
    }

    const timestamp = Date.now();
    const logEntry = { message, timestamp };
    this.state.gameLog.push(logEntry);
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

    if (this.state.status !== GameStatus.PLAYING) {
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
    if (this.state.status === GameStatus.PLAYING) {
      return { valid: false, error: "Une partie est déjà en cours" };
    }
    return { valid: true };
  }

  // ========== INTERFACE PUBLIQUE ==========

  public getState(): Game {
    return { ...this.state };
  }

  public subscribe(listener: (state: Game) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public setOnVictoryCallback(callback: () => void): void {
    this.onVictoryCallback = callback;
  }

  setOnGameUpdateCallback(callback: (gameState: Game) => void): void {
    this.onGameUpdateCallback = callback;
  }

  // ========== MÉTHODES UTILITAIRES MULTI-JOUEUR ==========

  /**
   * Charger un état de jeu complet (pour la reprise de partie multi-joueur)
   */
  public loadState(newState: Game): void {
    this.state = { ...newState };
    this.notifyListeners();
  }

  public updateState(updatedGameData: Game): void {
    // Temporairement désactiver les callbacks pour éviter les boucles
    const tempUpdateCallback = this.onGameUpdateCallback;
    this.onGameUpdateCallback = undefined;

    this.state = { ...updatedGameData };
    this.updatePlayableCards();
    this.notifyListeners();

    // Restaurer le callback après un délai
    setTimeout(() => {
      this.onGameUpdateCallback = tempUpdateCallback;
    }, 100);
  }

  /**
   * Obtenir un joueur par son username
   */
  public getPlayerByUsername(username: string): PlayerEntity | null {
    return this.state.players.find((p) => p.username === username) ?? null;
  }

  /**
   * Vérifier si un joueur peut jouer (sans username, pour le multi-joueur)
   */
  public isPlayerTurnByUsername(username: string): boolean {
    return this.state.playerTurnUsername === username;
  }

  /**
   * Forcer une mise à jour de l'état (pour la synchronisation)
   */
  public forceStateUpdate(): void {
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));

    // Callback pour sync automatique
    if (this.onGameUpdateCallback) {
      this.onGameUpdateCallback(this.getState());
    }
  }

  public getGameSummary(): string {
    if (!this.state) {
      return "🎮 État du Jeu Kora Battle\n═══════════════════════════\nStatus: Non initialisé\n═══════════════════════════";
    }

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
    if (!this.state) {
      console.warn(
        "Cannot handle automatic victory: engine state not initialized",
      );
      return;
    }

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

  public getVictoryType(playerUsername?: string): {
    type:
      | "normal"
      | "auto_sum"
      | "auto_lowest"
      | "auto_sevens"
      | "simple_kora"
      | "double_kora"
      | "triple_kora";
    title: string;
    description: string;
    multiplier: string;
    special: boolean;
  } {
    if (!this.state) {
      return {
        type: "normal" as const,
        title: "Partie non initialisée",
        description: "État du jeu non disponible",
        multiplier: "x1",
        special: false,
      };
    }

    const recentLogs = (this.state.gameLog ?? []).slice(-10);
    const isPlayerWinner = this.state.winnerUsername === playerUsername;

    for (const log of recentLogs) {
      const message = log.message;

      if (message.includes("TRIPLE KORA (333)")) {
        return {
          type: "triple_kora",
          title: "TRIPLE KORA ! 🎯",
          description: isPlayerWinner
            ? "Victoire avec 3 cartes 3 consécutives"
            : "Défaite - L'adversaire a joué 3 cartes 3 consécutives",
          multiplier: "x4",
          special: true,
        };
      }
      if (message.includes("DOUBLE KORA (33)")) {
        return {
          type: "double_kora",
          title: "DOUBLE KORA ! 🔥",
          description: isPlayerWinner
            ? "Victoire avec 2 cartes 3 consécutives"
            : "Défaite - L'adversaire a joué 2 cartes 3 consécutives",
          multiplier: "x3",
          special: true,
        };
      }
      if (message.includes("KORA Simple")) {
        return {
          type: "simple_kora",
          title: "KORA ! 🏆",
          description: isPlayerWinner
            ? "Victoire avec un 3 au tour final"
            : "Défaite - L'adversaire a joué un 3 au tour final",
          multiplier: "x2",
          special: true,
        };
      }

      if (message.includes("Victoire automatique")) {
        if (message.includes("cartes de 7")) {
          return {
            type: "auto_sevens",
            title: "Victoire des 7 ! 🎰",
            description: isPlayerWinner
              ? "Victoire avec au moins 3 cartes de 7"
              : "Défaite - L'adversaire a au moins 3 cartes de 7",
            multiplier: "x1",
            special: true,
          };
        }
        if (message.includes("Somme < 21")) {
          return {
            type: "auto_sum",
            title: "Victoire Automatique ! ⚡",
            description: isPlayerWinner
              ? "Somme des cartes inférieure à 21"
              : "Défaite - L'adversaire a une somme < 21",
            multiplier: "x1",
            special: true,
          };
        }
        if (message.includes("Somme la plus faible")) {
          return {
            type: "auto_lowest",
            title: "Victoire Automatique ! 📊",
            description: isPlayerWinner
              ? "Plus petite somme (les deux < 21)"
              : "Défaite - L'adversaire a la plus petite somme",
            multiplier: "x1",
            special: true,
          };
        }
      }
    }

    return {
      type: "normal",
      title: isPlayerWinner ? "Victoire ! 🎉" : "Défaite ! 💀",
      description: isPlayerWinner
        ? "Vous avez la main au tour final"
        : "L'adversaire a la main au tour final",
      multiplier: "x1",
      special: false,
    };
  }

  public getKorasWonThisGame(): number {
    const betAmount = this.state.currentBet;
    const victoryType = this.getVictoryType(); // Pas besoin de playerUsername ici, juste pour les types

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

  public getVictoryMessage(isPlayerWinner: boolean): string {
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

    const messages = isPlayerWinner ? victoryMessages : defeatMessages;
    return messages[Math.floor(Math.random() * messages.length)]!;
  }

  public setAIDifficulty(difficulty: AIDifficulty): void {
    if (!this.state) {
      console.warn("Cannot set AI difficulty: engine state not initialized");
      return;
    }

    this.state.players.find((p) => p.type === "ai")!.aiDifficulty = difficulty;
    this.notifyListeners();
  }

  public async triggerAITurn(aiPlayer: PlayerEntity): Promise<void> {
    if (!this.state) {
      console.warn("Cannot trigger AI turn: engine state not initialized");
      return;
    }

    if (this.state.status !== GameStatus.PLAYING) {
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

    // Délai de réflexion basé sur la difficulté et le nombre de cartes restantes
    let thinkingTime = 0;

    // Si l'IA n'a qu'une seule carte, jouer rapidement
    if (aiPlayer.hand && aiPlayer.hand.length === 1) {
      thinkingTime = 200; // Délai minimal pour la dernière carte
    } else {
      // Délai normal basé sur la difficulté
      thinkingTime =
        this.state.players.find((p) => p.type === "ai")!.aiDifficulty === "easy"
          ? 500
          : this.state.players.find((p) => p.type === "ai")!.aiDifficulty ===
              "medium"
            ? 1000
            : 1500;
    }

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

  public getAiUsername(difficulty: AIDifficulty): string {
    const difficultyMap = {
      easy: "bindi-du-tierqua",
      medium: "le-ndoss",
      hard: "le-grand-bandi",
    };
    return `${difficultyMap[difficulty]} (bot)`;
  }

  // Ajouter le 2e joueur à une partie multijoueur
  public joinOnlineGame(player: PlayerEntity): boolean {
    if (!this.state) return false;
    if (this.state.status !== GameStatus.WAITING) return false;
    if (this.state.players.length >= 2) return false;

    // Ajouter le joueur
    this.state.players.push(player);

    this.notifyListeners();
    return true;
  }

  // Démarrer la partie multijoueur (générer les cartes)
  public startOnlineGame(): boolean {
    if (!this.state) return false;
    if (this.state.status !== GameStatus.WAITING) return false;
    if (this.state.players.length !== 2) return false;

    // Générer et distribuer les cartes
    const { firstPlayer, secondPlayer } = this.distributeCards();
    this.state.players[0]!.hand = firstPlayer;
    this.state.players[1]!.hand = secondPlayer;

    // Déterminer qui commence (simple: premier joueur)
    this.state.hasHandUsername = this.state.players[0]!.username;
    this.state.playerTurnUsername = this.state.players[0]!.username;

    // Passer en mode "playing"
    this.state.status = GameStatus.PLAYING;

    // Mettre à jour les cartes jouables
    this.updatePlayableCards();

    this.notifyListeners();
    return true;
  }
}

// Instance singleton du game engine
let gameEngineInstance: KoraGameEngine | null = null;

export const createKoraGameEngine = (gameData: Game) => {
  gameEngineInstance = new KoraGameEngine(gameData);
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

// Construire un état initial de jeu à partir d'une configuration (exposé publiquement)
export const buildInitialGameStateFromConfig = (
  gameConfig: GameConfig,
): Game => {
  const seed = crypto.randomUUID();
  const players = [...gameConfig.players];

  if (gameConfig.mode === "AI") {
    const difficultyMap = {
      easy: "bindi-du-tierqua",
      medium: "le-ndoss",
      hard: "le-grand-bandi",
    } as const;
    players.push({
      username: `${difficultyMap[(gameConfig.aiDifficulty ?? "medium") as AIDifficulty]} (bot)`,
      type: "ai",
      isConnected: true,
      koras: 0,
      aiDifficulty: (gameConfig.aiDifficulty ?? "medium") as AIDifficulty,
    });
  }

  return {
    gameId: `game-${seed}`,
    seed,
    version: 0,
    status: GameStatus.WAITING,
    currentRound: 1,
    maxRounds: gameConfig.maxRounds ?? 5,
    hasHandUsername: null,
    playerTurnUsername: null,
    players,
    playedCards: [],
    currentBet: gameConfig.currentBet ?? 100,
    winnerUsername: null,
    endReason: null,
    gameLog: [],
    actions: [],
    mode: gameConfig.mode,
    maxPlayers: gameConfig.maxPlayers ?? 2,
    aiDifficulty:
      gameConfig.mode === "AI" ? (gameConfig.aiDifficulty ?? "medium") : null,
    roomName: gameConfig.roomName,
    isPrivate: gameConfig.isPrivate,
    hostUsername: gameConfig.hostUsername,
    joinCode: gameConfig.joinCode,
    startedAt: new Date(),
    endedAt: null,
    lastSyncedAt: new Date(),
    victoryType: null,
  };
};
