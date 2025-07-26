import { type Card, type Suit, type Rank } from "@/components/common/deck";

// Types spécifiques au game engine
export type Player = "player" | "opponent";
export type GameStatus = "waiting" | "playing" | "ended" | "victory" | "defeat";
export type KoraType = "none" | "simple" | "double" | "triple";

export interface PlayedCard {
  card: Card;
  player: Player;
  round: number;
  timestamp: number;
}

export interface GameAction {
  type: "PLAY_CARD" | "START_GAME" | "END_GAME" | "SYNC_STATE";
  payload: unknown;
  timestamp: number;
  playerId?: string;
  actionId: string;
}

export interface GameState {
  // État général
  gameId: string;
  status: GameStatus;
  currentRound: number;
  playerWithHand: Player;
  firstPlayer: Player;

  // Cartes avec IDs déterministes
  playerCards: Card[];
  opponentCards: Card[];
  playedCards: PlayedCard[];

  // Dernière carte jouée
  lastPlayedCard: Card | null;
  lastPlayedBy: Player | null;

  // Scores et exploits
  playerKoras: number;
  opponentKoras: number;
  currentBet: number;
  koraStreak: { player: Player; count: number; rounds: number[] };

  // Seed pour reproductibilité
  seed: string;

  // Version de l'état pour synchronisation
  version: number;

  // Mode God pour debug
  godMode: boolean;

  // Messages et logs avec timestamps
  gameLog: Array<{ message: string; timestamp: number }>;
}

export interface GameActions {
  // Actions principales
  startNewGame: () => void;
  playCard: (cardId: string, player: Player) => boolean;

  // Actions de debug/god mode
  toggleGodMode: () => void;
  forcePlayerHand: (player: Player) => void;
  setPlayerCards: (cards: Card[], player: Player) => void;

  // Utilitaires
  getPlayableCards: (player: Player) => Card[];
  canPlayCard: (cardId: string, player: Player) => boolean;
  getGameSummary: () => string;
}

export class KoraGameEngine {
  private state: GameState;
  private listeners: ((state: GameState) => void)[] = [];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GameState {
    const seed = Date.now().toString();
    return {
      gameId: `game-${seed}`,
      seed,
      version: 0,
      status: "waiting",
      currentRound: 0,
      playerWithHand: "player",
      firstPlayer: "player",
      playerCards: [],
      opponentCards: [],
      playedCards: [],
      lastPlayedCard: null,
      lastPlayedBy: null,
      playerKoras: 100,
      opponentKoras: 100,
      currentBet: 10,
      koraStreak: { player: "player", count: 0, rounds: [] },
      godMode: false,
      gameLog: [],
    };
  }

  // ========== CRÉATION ET DISTRIBUTION DES CARTES ==========

  private createDeck(): Card[] {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Rank[] = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    const deck: Card[] = [];

    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({
          suit,
          rank,
          jouable: false,
          id: `${suit}-${rank}-${this.state.seed}-${suits.indexOf(suit) * 13 + ranks.indexOf(rank)}`,
        });
      });
    });

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
      case "A":
        return 1;
      case "J":
        return 11;
      case "Q":
        return 12;
      case "K":
        return 13;
      default:
        return parseInt(rank);
    }
  }

  private calculateHandSum(cards: Card[]): number {
    return cards.reduce((sum, card) => sum + this.getCardValue(card.rank), 0);
  }

  private distributeCards(): { playerCards: Card[]; opponentCards: Card[] } {
    const deck = this.createDeck();
    const playerCards = deck.slice(0, 5);
    const opponentCards = deck.slice(5, 10);

    return { playerCards, opponentCards };
  }

  // ========== LOGIQUE DE JEU PRINCIPALE ==========

  public startNewGame(): void {
    this.log("🎮 Nouvelle partie commencée !");

    // Distribution des cartes
    const { playerCards, opponentCards } = this.distributeCards();

    // Calcul des sommes pour victoire automatique
    const playerSum = this.calculateHandSum(playerCards);
    const opponentSum = this.calculateHandSum(opponentCards);

    this.log(`Somme joueur: ${playerSum}, Somme adversaire: ${opponentSum}`);

    // Vérification victoire automatique (somme < 21)
    if (playerSum < 21 && opponentSum >= 21) {
      this.state = {
        ...this.getInitialState(),
        status: "victory",
        playerCards,
        opponentCards,
      };
      this.log("🏆 Victoire automatique ! (Somme < 21)");
      this.notifyListeners();
      return;
    }

    if (opponentSum < 21 && playerSum >= 21) {
      this.state = {
        ...this.getInitialState(),
        status: "defeat",
        playerCards,
        opponentCards,
      };
      this.log("💀 Défaite automatique ! (Adversaire somme < 21)");
      this.notifyListeners();
      return;
    }

    if (playerSum < 21 && opponentSum < 21) {
      // Les deux ont < 21, celui avec la plus petite somme gagne
      const winner = playerSum < opponentSum ? "player" : "opponent";
      this.state = {
        ...this.getInitialState(),
        status: winner === "player" ? "victory" : "defeat",
        playerCards,
        opponentCards,
      };
      this.log(
        `🎯 Victoire automatique ! (Somme la plus faible: ${winner === "player" ? playerSum : opponentSum})`,
      );
      this.notifyListeners();
      return;
    }

    // Partie normale - déterminer qui commence
    const firstPlayer: Player = Math.random() < 0.5 ? "player" : "opponent";

    this.state = {
      ...this.getInitialState(),
      status: "playing",
      currentRound: 1,
      playerWithHand: firstPlayer,
      firstPlayer,
      playerCards,
      opponentCards,
    };
    this.log(
      `🎲 ${firstPlayer === "player" ? "Vous commencez" : "L'adversaire commence"} !`,
    );

    // Mettre à jour les cartes jouables
    this.updatePlayableCards();
    this.notifyListeners();
  }

  public playCard(cardId: string, player: Player): boolean {
    if (this.state.status !== "playing") {
      this.log("❌ Impossible de jouer : la partie n'est pas en cours");
      return false;
    }

    // Vérifier si c'est le tour du joueur
    const isPlayerTurn = this.isPlayerTurn(player);
    if (!isPlayerTurn && !this.state.godMode) {
      this.log("❌ Ce n'est pas votre tour !");
      return false;
    }

    // Trouver la carte
    const playerCards =
      player === "player" ? this.state.playerCards : this.state.opponentCards;
    const cardIndex = playerCards.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) {
      this.log("❌ Carte non trouvée !");
      return false;
    }

    const card = playerCards[cardIndex];
    if (!card) {
      this.log("❌ Carte introuvable !");
      return false;
    }

    // Vérifier si la carte est jouable
    if (!card.jouable && !this.state.godMode) {
      this.log("❌ Cette carte n'est pas jouable !");
      return false;
    }

    // Jouer la carte
    const newPlayedCards: PlayedCard[] = [
      ...this.state.playedCards,
      {
        card,
        player,
        round: this.state.currentRound,
        timestamp: Date.now(),
      },
    ];

    // Retirer la carte de la main du joueur
    const newPlayerCards =
      player === "player"
        ? this.state.playerCards.filter((c) => c.id !== cardId)
        : this.state.playerCards;

    const newOpponentCards =
      player === "opponent"
        ? this.state.opponentCards.filter((c) => c.id !== cardId)
        : this.state.opponentCards;

    this.state = {
      ...this.state,
      playerCards: newPlayerCards,
      opponentCards: newOpponentCards,
      playedCards: newPlayedCards,
      lastPlayedCard: card,
      lastPlayedBy: player,
    };

    this.log(
      `🃏 ${player === "player" ? "Vous jouez" : "Adversaire joue"} : ${card.rank}${this.getSuitSymbol(card.suit)}`,
    );

    // Vérifier si le tour est terminé (2 cartes jouées)
    const currentRoundCards = newPlayedCards.filter(
      (p) => p.round === this.state.currentRound,
    );

    if (currentRoundCards.length === 2) {
      this.resolveRound(currentRoundCards);
    } else {
      // Passer le tour à l'autre joueur
      this.switchTurn();
    }

    this.updatePlayableCards();
    this.notifyListeners();
    return true;
  }

  private resolveRound(
    roundCards: { card: Card; player: Player; round: number }[],
  ): void {
    if (roundCards.length < 2) return;
    const [firstCard, secondCard] = roundCards;
    if (!firstCard || !secondCard) return;

    // Déterminer qui gagne le tour
    let winner: Player;

    if (firstCard.card.suit === secondCard.card.suit) {
      // Même famille : comparer les valeurs
      const firstValue = this.getCardValue(firstCard.card.rank);
      const secondValue = this.getCardValue(secondCard.card.rank);

      winner = secondValue > firstValue ? secondCard.player : firstCard.player;
      this.log(
        `⚔️ ${secondValue > firstValue ? "Adversaire" : "Premier joueur"} gagne le tour ! (${secondValue} vs ${firstValue})`,
      );
    } else {
      // Familles différentes : celui qui avait la main garde la main
      winner = this.state.playerWithHand;
      this.log(
        `⚔️ Familles différentes : ${winner === "player" ? "Vous gardez" : "Adversaire garde"} la main !`,
      );
    }

    // Vérifier les exploits Kora (3 au tour 5)
    if (this.state.currentRound === 5) {
      this.checkKoraExploits(roundCards, winner);
    }

    // Mettre à jour l'état
    this.state.playerWithHand = winner;

    // Passer au tour suivant ou terminer la partie
    if (
      this.state.currentRound >= 5 ||
      this.state.playerCards.length === 0 ||
      this.state.opponentCards.length === 0
    ) {
      this.endGame(winner);
    } else {
      this.state.currentRound++;
      this.log(
        `🔄 Tour ${this.state.currentRound} - ${winner === "player" ? "Vous avez" : "Adversaire a"} la main`,
      );
    }
  }

  private checkKoraExploits(
    roundCards: { card: Card; player: Player; round: number }[],
    winner: Player,
  ): void {
    const winnerCard = roundCards.find((rc) => rc.player === winner)?.card;

    if (winnerCard && winnerCard.rank === "3") {
      this.log("🏆 KORA ! Victoire avec un 3 au tour final !");
      // TODO: Implémenter la logique des koras multiples (33, 333)
    }
  }

  private endGame(winner: Player): void {
    this.state.status = winner === "player" ? "victory" : "defeat";
    this.log(
      `🎉 Fin de partie ! ${winner === "player" ? "Vous gagnez" : "Adversaire gagne"} !`,
    );

    // TODO: Gérer les gains/pertes de koras
  }

  // ========== GESTION DES CARTES JOUABLES ==========

  private updatePlayableCards(): void {
    // Mettre à jour les cartes jouables pour le joueur
    this.state.playerCards = this.state.playerCards.map((card) => ({
      ...card,
      jouable: this.canPlayCard(card.id, "player"),
    }));

    // Mettre à jour les cartes jouables pour l'adversaire
    this.state.opponentCards = this.state.opponentCards.map((card) => ({
      ...card,
      jouable: this.canPlayCard(card.id, "opponent"),
    }));
  }

  public canPlayCard(cardId: string, player: Player): boolean {
    if (this.state.status !== "playing") return false;
    if (!this.isPlayerTurn(player) && !this.state.godMode) return false;

    const playerCards =
      player === "player" ? this.state.playerCards : this.state.opponentCards;
    const card = playerCards.find((c) => c.id === cardId);
    if (!card) return false;

    // Si le joueur a la main, toutes ses cartes sont jouables
    if (this.state.playerWithHand === player) {
      return true;
    }

    // Si pas de carte jouée ce tour, toutes les cartes sont jouables
    if (!this.state.lastPlayedCard || !this.state.lastPlayedBy) {
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
    const hasRequiredSuit = playerCards.some((c) => c.suit === requiredSuit);

    if (hasRequiredSuit) {
      // Doit jouer la même famille
      return card.suit === requiredSuit;
    } else {
      // Peut jouer n'importe quelle carte
      return true;
    }
  }

  public getPlayableCards(player: Player): Card[] {
    const playerCards =
      player === "player" ? this.state.playerCards : this.state.opponentCards;
    return playerCards.filter((card) => card.jouable);
  }

  // ========== UTILITAIRES ==========

  private isPlayerTurn(player: Player): boolean {
    const currentRoundCards = this.state.playedCards.filter(
      (p) => p.round === this.state.currentRound,
    );

    if (currentRoundCards.length === 0) {
      // Aucune carte jouée ce tour : c'est à celui qui a la main
      return this.state.playerWithHand === player;
    } else if (currentRoundCards.length === 1) {
      // Une carte jouée : c'est à l'autre joueur
      const firstPlayer = currentRoundCards[0]!.player;
      return firstPlayer !== player;
    } else {
      // Deux cartes jouées : tour terminé
      return false;
    }
  }

  private switchTurn(): void {
    // Cette méthode est appelée quand une carte est jouée mais le tour n'est pas fini
    // La logique du tour est gérée dans isPlayerTurn()
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

  // ========== MODE GOD POUR DEBUG ==========

  public toggleGodMode(): void {
    this.state.godMode = !this.state.godMode;
    this.log(`🔧 Mode God ${this.state.godMode ? "ACTIVÉ" : "DÉSACTIVÉ"}`);
    this.notifyListeners();
  }

  public forcePlayerHand(player: Player): void {
    if (!this.state.godMode) return;
    this.state.playerWithHand = player;
    this.updatePlayableCards();
    this.log(
      `🔧 [God Mode] ${player === "player" ? "Joueur" : "Adversaire"} a maintenant la main`,
    );
    this.notifyListeners();
  }

  public setPlayerCards(cards: Card[], player: Player): void {
    if (!this.state.godMode) return;

    if (player === "player") {
      this.state.playerCards = cards;
    } else {
      this.state.opponentCards = cards;
    }

    this.updatePlayableCards();
    this.log(
      `🔧 [God Mode] Cartes de ${player === "player" ? "joueur" : "adversaire"} modifiées`,
    );
    this.notifyListeners();
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

    const typedPlayer = player as Player;

    if (this.state.status !== "playing") {
      return { valid: false, error: "La partie n'est pas en cours" };
    }

    if (!this.isPlayerTurn(typedPlayer) && !this.state.godMode) {
      return { valid: false, error: "Ce n'est pas le tour de ce joueur" };
    }

    const playerCards =
      typedPlayer === "player"
        ? this.state.playerCards
        : this.state.opponentCards;
    const card = playerCards.find((c) => c.id === cardId);

    if (!card) {
      return { valid: false, error: "Carte non trouvée" };
    }

    if (!this.canPlayCard(cardId, typedPlayer)) {
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
Main: ${state.playerWithHand === "player" ? "Joueur" : "Adversaire"}
Cartes Joueur: ${state.playerCards.length}
Cartes Adversaire: ${state.opponentCards.length}
Koras Joueur: ${state.playerKoras}
Koras Adversaire: ${state.opponentKoras}
Mode God: ${state.godMode ? "✅" : "❌"}
═══════════════════════════
    `.trim();
  }
}

// Instance singleton du game engine
export const gameEngine = new KoraGameEngine();
