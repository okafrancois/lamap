# LaMap241 - Spécifications Techniques

## Agent IA : Contexte du projet

**Nom** : LaMap241
**Type** : Application mobile de jeu de cartes compétitif avec mise
**Stack** : Expo (React Native) + Convex (Backend) + Clerk (Auth)
**Inspiration UX** : Chess.com (flow de matchmaking et parties)

---

## 1. Architecture du projet

### Structure des dossiers

```
lamap241/
├── assets/                    # Images, fonts, sons
├── convex/                    # Backend Convex
│   ├── schema.ts              # Schéma de données
│   ├── users.ts               # Mutations/queries utilisateurs
│   ├── matches.ts             # Logique de matchmaking
│   ├── game.ts                # Logique de jeu (autoritaire)
│   └── economy.ts             # Gestion Kora (jetons)
├── src/
│   ├── app/                   # Expo Router (navigation)
│   │   ├── (auth)/            # Écrans authentification
│   │   ├── (tabs)/            # Navigation principale
│   │   ├── (lobby)/           # Matchmaking & salles d'attente
│   │   ├── (game)/            # Écrans de jeu
│   │   └── _layout.tsx        # Layout racine + providers
│   ├── components/            # Composants UI réutilisables
│   ├── hooks/                 # Hooks personnalisés
│   ├── utils/                 # Helpers et constantes
│   └── types/                 # Types TypeScript
├── app.json
├── eas.json
└── package.json
```

---

## 2. Navigation (Expo Router)

### Arborescence des routes

```
src/app/
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx              # Connexion (phone/email + OTP)
│   └── register.tsx           # Inscription
│
├── (tabs)/
│   ├── _layout.tsx            # TabBar: Jouer | Portefeuille | Profil
│   ├── index.tsx              # Home: boutons Play
│   ├── wallet.tsx             # Solde Kora, transactions
│   └── profile.tsx            # Stats, historique, paramètres
│
├── (lobby)/
│   ├── _layout.tsx
│   ├── select-mode.tsx        # Choix: vs Joueur | vs IA
│   ├── select-bet.tsx         # Sélection mise (10, 50, 100, 500 Kora)
│   ├── matchmaking.tsx        # Recherche d'adversaire (style chess.com)
│   └── room/[roomId].tsx      # Salle d'attente avant match
│
├── (game)/
│   ├── _layout.tsx
│   ├── match/[matchId].tsx    # Écran de jeu principal
│   └── result/[matchId].tsx   # Écran résultat (victoire/défaite)
│
└── _layout.tsx                # Providers (Clerk, Convex)
```

---

## 3. Flow utilisateur (inspiré Chess.com)

### 3.1 Flow de matchmaking

```
[Home]
   │
   ▼
[Sélection Mode] ──────────────────────────────┐
   │                                            │
   ├── "vs Joueur"                              ├── "vs IA"
   │      │                                     │      │
   │      ▼                                     │      ▼
   │  [Sélection Mise]                          │  [Sélection Difficulté]
   │      │                                     │      │
   │      ▼                                     │      ▼
   │  [Matchmaking]                             │  [Lancement partie]
   │      │ ← Animation recherche               │
   │      │ ← "Adversaire trouvé!"              │
   │      ▼                                     │
   │  [Salle d'attente]                         │
   │      │ ← Les 2 joueurs confirment          │
   │      ▼                                     │
   └──────┴─────────────────────────────────────┘
                        │
                        ▼
                   [MATCH EN COURS]
                        │
                        ▼
                   [Écran Résultat]
                        │
                        ├── "Rejouer" → retour matchmaking
                        └── "Quitter" → retour Home
```

### 3.2 États du matchmaking

| État          | Description              | Action UI                                 |
| ------------- | ------------------------ | ----------------------------------------- |
| `IDLE`        | Aucune recherche         | Bouton "Jouer" actif                      |
| `SEARCHING`   | Recherche en cours       | Spinner + "Recherche..." + bouton Annuler |
| `FOUND`       | Adversaire trouvé        | Animation + infos adversaire              |
| `READY_CHECK` | Confirmation des joueurs | Bouton "Prêt" (countdown 10s)             |
| `STARTING`    | Lancement du match       | Transition vers écran de jeu              |
| `CANCELLED`   | Annulé/Timeout           | Retour au lobby                           |

---

## 4. Schéma de données Convex

### 4.1 Tables principales

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    koraBalance: v.number(),
    totalWins: v.number(),
    totalLosses: v.number(),
    totalKoraWon: v.number(),
    totalKoraLost: v.number(),
    createdAt: v.number(),
  }).index("by_clerk", ["clerkId"]),

  matches: defineTable({
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")),
    isVsAI: v.boolean(),
    aiDifficulty: v.optional(v.string()),
    betAmount: v.number(),
    status: v.string(),
    winnerId: v.optional(v.id("users")),
    winType: v.optional(v.string()),
    koraMultiplier: v.number(),
    currentTurn: v.number(),
    currentPlayerId: v.optional(v.id("users")),
    leadSuit: v.optional(v.string()),
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  hands: defineTable({
    matchId: v.id("matches"),
    playerId: v.id("users"),
    cards: v.array(
      v.object({
        suit: v.string(),
        value: v.number(),
      })
    ),
  }).index("by_match", ["matchId"]),

  plays: defineTable({
    matchId: v.id("matches"),
    turn: v.number(),
    playerId: v.id("users"),
    card: v.object({
      suit: v.string(),
      value: v.number(),
    }),
    playedAt: v.number(),
  }).index("by_match_turn", ["matchId", "turn"]),

  turnResults: defineTable({
    matchId: v.id("matches"),
    turn: v.number(),
    winnerId: v.id("users"),
    winningCard: v.object({
      suit: v.string(),
      value: v.number(),
    }),
  }).index("by_match", ["matchId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.string(),
    amount: v.number(),
    matchId: v.optional(v.id("matches")),
    description: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  matchmakingQueue: defineTable({
    userId: v.id("users"),
    betAmount: v.number(),
    status: v.string(),
    matchedWith: v.optional(v.id("users")),
    matchId: v.optional(v.id("matches")),
    joinedAt: v.number(),
  }).index("by_status_bet", ["status", "betAmount"]),
});
```

### 4.2 Mutations principales

```typescript
joinQueue(userId, betAmount);
leaveQueue(userId);
findMatch(userId);

createMatch(player1Id, player2Id, betAmount);
startMatch(matchId);
playCard(matchId, playerId, card);
checkAutoWin(matchId);
endTurn(matchId);
endMatch(matchId);

deductBet(userId, amount);
creditWinnings(userId, amount);
getPlatformRake(matchId);
```

---

## 5. Logique de jeu (côté serveur)

### 5.1 Règles implémentées dans Convex

```typescript
const DECK_VALUES = [3, 4, 5, 6, 7, 8, 9, 10];
const SUITS = ["spade", "heart", "diamond", "club"];
const EXCLUDED_CARD = { suit: "spade", value: 10 };

function generateDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of DECK_VALUES) {
      if (!(suit === "spade" && value === 10)) {
        deck.push({ suit, value });
      }
    }
  }
  return shuffle(deck);
}

function dealCards(deck: Card[]): { hand1: Card[]; hand2: Card[] } {
  return {
    hand1: deck.slice(0, 5),
    hand2: deck.slice(5, 10),
  };
}

function checkAutoWin(hand: Card[]): string | null {
  const sum = hand.reduce((acc, card) => acc + card.value, 0);
  if (sum < 21) return "main_faible";

  const sevens = hand.filter((card) => card.value === 7);
  if (sevens.length >= 3) return "triple_7";

  return null;
}

function isValidPlay(
  hand: Card[],
  card: Card,
  leadSuit: string | null
): boolean {
  if (!leadSuit) return true;

  const hasSuit = hand.some((c) => c.suit === leadSuit);
  if (hasSuit) {
    return card.suit === leadSuit;
  }
  return true;
}

function getTurnWinner(play1: Play, play2: Play, leadSuit: string): Play {
  if (play1.card.suit !== leadSuit && play2.card.suit === leadSuit) {
    return play2;
  }
  if (play2.card.suit !== leadSuit && play1.card.suit === leadSuit) {
    return play1;
  }

  return play1.card.value > play2.card.value ? play1 : play2;
}

function calculateKoraMultiplier(turnResults: TurnResult[]): number {
  const lastThree = turnResults.slice(-3);

  if (
    lastThree.length === 3 &&
    lastThree.every((t) => t.winningCard.value === 3)
  ) {
    return 8;
  }

  const lastTwo = turnResults.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every((t) => t.winningCard.value === 3)) {
    return 4;
  }

  const lastTurn = turnResults[4];
  if (lastTurn && lastTurn.winningCard.value === 3) {
    return 2;
  }

  return 1;
}
```

### 5.2 Logique IA

```typescript
type Difficulty = "easy" | "medium" | "hard";

function aiSelectCard(
  hand: Card[],
  leadSuit: string | null,
  turn: number,
  difficulty: Difficulty,
  gameHistory: TurnResult[]
): Card {
  const playableCards = getPlayableCards(hand, leadSuit);

  switch (difficulty) {
    case "easy":
      return randomChoice(playableCards);

    case "medium":
      if (turn < 4) {
        return getLowestCard(playableCards);
      }
      return getHighestCard(playableCards);

    case "hard":
      return advancedStrategy(hand, leadSuit, turn, gameHistory);
  }
}

function advancedStrategy(
  hand: Card[],
  leadSuit: string | null,
  turn: number,
  history: TurnResult[]
): Card {
  const playable = getPlayableCards(hand, leadSuit);

  if (turn === 5) {
    const three = playable.find((c) => c.value === 3);
    if (three && canWinWith(three, leadSuit)) {
      return three;
    }
    return getHighestCard(playable);
  }

  if (turn >= 3) {
    const nonThrees = playable.filter((c) => c.value !== 3);
    if (nonThrees.length > 0) {
      return getHighestCard(nonThrees);
    }
  }

  return getLowestCard(playable);
}
```

---

## 6. Composants UI

### 6.1 Liste des composants

```
src/components/
├── ui/
│   ├── Button.tsx             # Boutons (primary, secondary, ghost)
│   ├── Modal.tsx              # Modales
│   ├── Badge.tsx              # Badges (Kora, statut)
│   └── Avatar.tsx             # Avatar utilisateur
│
├── game/
│   ├── PlayingCard.tsx        # Carte à jouer (valeur, couleur, état)
│   ├── CardHand.tsx           # Main du joueur (5 cartes)
│   ├── PlayArea.tsx           # Zone de jeu centrale
│   ├── TurnIndicator.tsx      # Indicateur de tour (1-5)
│   ├── PlayerInfo.tsx         # Info joueur (avatar, nom, timer)
│   └── GameResult.tsx         # Overlay résultat (victoire/défaite)
│
├── lobby/
│   ├── BetSelector.tsx        # Sélection de mise
│   ├── MatchmakingSpinner.tsx # Animation recherche
│   ├── OpponentFound.tsx      # Adversaire trouvé
│   └── ReadyButton.tsx        # Bouton "Prêt"
│
├── wallet/
│   ├── KoraBalance.tsx        # Affichage solde
│   ├── TransactionItem.tsx    # Ligne transaction
│   └── DepositButton.tsx      # Bouton dépôt
│
└── common/
    ├── Header.tsx             # Header avec navigation
    ├── TabBar.tsx             # Barre d'onglets
    └── LoadingScreen.tsx      # Écran de chargement
```

### 6.2 Composant PlayingCard

```typescript
interface PlayingCardProps {
  suit: "spade" | "heart" | "diamond" | "club";
  value: number;
  state: "playable" | "disabled" | "selected" | "played";
  onPress?: () => void;
}

const SUIT_COLORS = {
  spade: "#1A1A1A",
  club: "#1A1A1A",
  heart: "#B4443E",
  diamond: "#B4443E",
};

const SUIT_SYMBOLS = {
  spade: "♠",
  club: "♣",
  heart: "♥",
  diamond: "♦",
};
```

---

## 7. Gestion d'état temps réel

### 7.1 Hooks Convex

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useGame(matchId: string) {
  const match = useQuery(api.matches.get, { matchId });
  const myHand = useQuery(api.hands.getMyHand, { matchId });
  const plays = useQuery(api.plays.getByTurn, {
    matchId,
    turn: match?.currentTurn,
  });
  const turnResults = useQuery(api.turnResults.getByMatch, { matchId });

  const playCard = useMutation(api.game.playCard);

  return {
    match,
    myHand,
    currentPlays: plays,
    turnResults,
    playCard: (card) => playCard({ matchId, card }),
    isMyTurn: match?.currentPlayerId === myUserId,
    canPlay: (card) => isValidPlay(myHand, card, match?.leadSuit),
  };
}
```

### 7.2 Hook Matchmaking

```typescript
export function useMatchmaking() {
  const queueStatus = useQuery(api.matchmaking.getMyStatus);

  const joinQueue = useMutation(api.matchmaking.join);
  const leaveQueue = useMutation(api.matchmaking.leave);

  return {
    status: queueStatus?.status,
    opponent: queueStatus?.opponent,
    matchId: queueStatus?.matchId,
    joinQueue: (betAmount) => joinQueue({ betAmount }),
    leaveQueue,
    timeInQueue: queueStatus?.joinedAt ? Date.now() - queueStatus.joinedAt : 0,
  };
}
```

---

## 8. Économie Kora

### 8.1 Flow des transactions

```
[Joueur rejoint matchmaking]
         │
         ▼
[Mise bloquée (escrow)]
         │
         ├── Match annulé → Remboursement 100%
         │
         ▼
[Match terminé]
         │
         ├── Mise totale = Joueur1 + Joueur2
         │
         ▼
[Calcul gains]
         │
         ├── Commission plateforme = 10%
         ├── Gain vainqueur = 90% × mise totale × multiplicateur
         │
         ▼
[Crédit compte gagnant]
```

### 8.2 Multiplicateurs

| Type de victoire | Multiplicateur | Exemple (mise 100) |
| ---------------- | -------------- | ------------------ |
| Normale          | x1             | 180 Kora           |
| Kora simple      | x2             | 360 Kora           |
| Double Kora      | x4             | 720 Kora           |
| Triple Kora      | x8             | 1440 Kora          |

---

## 9. Sécurité

### 9.1 Principes

| Règle                  | Implémentation                             |
| ---------------------- | ------------------------------------------ |
| Client = Vue seulement | Le client affiche et envoie des intentions |
| Serveur = Autorité     | Convex valide toutes les actions           |
| Pas de triche          | Deck, shuffle, validation côté Convex      |
| Pas de manipulation    | Gains calculés et versés par le serveur    |

### 9.2 Validations Convex

```typescript

```

---

## 10. Checklist de développement

### Phase 1 : Foundation

- [ ] Setup Expo + TypeScript + Expo Router
- [ ] Configurer Convex
- [ ] Intégrer Clerk (auth)
- [ ] Créer le schéma de données
- [ ] Implémenter les écrans auth

### Phase 2 : Core Game

- [ ] Logique de jeu dans Convex
- [ ] Composant PlayingCard
- [ ] Écran de match
- [ ] Gestion des tours
- [ ] Détection victoires automatiques
- [ ] Calcul Kora

### Phase 3 : Matchmaking

- [ ] File d'attente Convex
- [ ] UI matchmaking (style chess.com)
- [ ] Salle d'attente
- [ ] Ready check

### Phase 4 : Économie

- [ ] Système Kora
- [ ] Transactions
- [ ] Historique
- [ ] Portefeuille UI

### Phase 5 : IA

- [ ] Agent IA basique
- [ ] Difficultés (easy/medium/hard)
- [ ] Mode vs IA

### Phase 6 : Polish

- [ ] Animations cartes
- [ ] Sons
- [ ] Notifications
- [ ] Tests
- [ ] Build EAS

---

## 11. Commandes utiles

```bash
# Développement
npx expo start                    # Lancer l'app
npx convex dev                    # Lancer Convex en dev

# Build
eas build --platform ios          # Build iOS
eas build --platform android      # Build Android

# Déploiement
npx convex deploy                 # Déployer Convex en prod
eas submit                        # Soumettre aux stores
```

---

## Références

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Convex Docs](https://docs.convex.dev/)
- [Clerk + Expo](https://clerk.com/docs/quickstarts/expo)
- Chess.com (inspiration UX matchmaking)
