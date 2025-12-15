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

| État | Description | Action UI |
|------|-------------|-----------|
| `IDLE` | Aucune recherche | Bouton "Jouer" actif |
| `SEARCHING` | Recherche en cours | Spinner + "Recherche..." + bouton Annuler |
| `FOUND` | Adversaire trouvé | Animation + infos adversaire |
| `READY_CHECK` | Confirmation des joueurs | Bouton "Prêt" (countdown 10s) |
| `STARTING` | Lancement du match | Transition vers écran de jeu |
| `CANCELLED` | Annulé/Timeout | Retour au lobby |

---

## 4. Schéma de données Convex

### 4.1 Tables principales

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  
  // Utilisateurs
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    koraBalance: v.number(),           // Solde en jetons
    totalWins: v.number(),
    totalLosses: v.number(),
    totalKoraWon: v.number(),
    totalKoraLost: v.number(),
    createdAt: v.number(),
  }).index("by_clerk", ["clerkId"]),

  // Matchs
  matches: defineTable({
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")),  // null si vs IA
    isVsAI: v.boolean(),
    aiDifficulty: v.optional(v.string()),  // "easy" | "medium" | "hard"
    betAmount: v.number(),                  // Mise par joueur
    status: v.string(),                     // "waiting" | "ready" | "playing" | "finished"
    winnerId: v.optional(v.id("users")),
    winType: v.optional(v.string()),        // "normal" | "kora" | "double_kora" | "triple_kora" | "main_faible" | "triple_7"
    koraMultiplier: v.number(),             // 1, 2, 4, ou 8
    currentTurn: v.number(),                // 1 à 5
    currentPlayerId: v.optional(v.id("users")),
    leadSuit: v.optional(v.string()),       // Couleur demandée ce tour
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // Mains des joueurs (cartes en main)
  hands: defineTable({
    matchId: v.id("matches"),
    playerId: v.id("users"),               // "ai" pour l'IA
    cards: v.array(v.object({
      suit: v.string(),                    // "spade" | "heart" | "diamond" | "club"
      value: v.number(),                   // 3-10
    })),
  }).index("by_match", ["matchId"]),

  // Cartes jouées par tour
  plays: defineTable({
    matchId: v.id("matches"),
    turn: v.number(),                      // 1 à 5
    playerId: v.id("users"),
    card: v.object({
      suit: v.string(),
      value: v.number(),
    }),
    playedAt: v.number(),
  }).index("by_match_turn", ["matchId", "turn"]),

  // Historique des tours (qui a gagné chaque tour)
  turnResults: defineTable({
    matchId: v.id("matches"),
    turn: v.number(),
    winnerId: v.id("users"),
    winningCard: v.object({
      suit: v.string(),
      value: v.number(),
    }),
  }).index("by_match", ["matchId"]),

  // Transactions Kora
  transactions: defineTable({
    userId: v.id("users"),
    type: v.string(),                      // "bet" | "win" | "deposit" | "withdrawal"
    amount: v.number(),                    // Positif ou négatif
    matchId: v.optional(v.id("matches")),
    description: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // File d'attente matchmaking
  matchmakingQueue: defineTable({
    userId: v.id("users"),
    betAmount: v.number(),
    status: v.string(),                    // "searching" | "matched" | "cancelled"
    matchedWith: v.optional(v.id("users")),
    matchId: v.optional(v.id("matches")),
    joinedAt: v.number(),
  }).index("by_status_bet", ["status", "betAmount"]),

});
```

### 4.2 Mutations principales

```typescript
// Actions Convex à implémenter

// Matchmaking
joinQueue(userId, betAmount)         // Rejoindre la file
leaveQueue(userId)                   // Quitter la file
findMatch(userId)                    // Chercher un adversaire

// Partie
createMatch(player1Id, player2Id, betAmount)
startMatch(matchId)                  // Distribuer les cartes
playCard(matchId, playerId, card)    // Jouer une carte
checkAutoWin(matchId)                // Vérifier main faible / triple 7
endTurn(matchId)                     // Résoudre le tour
endMatch(matchId)                    // Finaliser et payer

// Économie
deductBet(userId, amount)            // Prélever mise
creditWinnings(userId, amount)       // Créditer gains
getPlatformRake(matchId)             // Calculer commission 10%
```

---

## 5. Logique de jeu (côté serveur)

### 5.1 Règles implémentées dans Convex

```typescript
// convex/game.ts - Logique métier

const DECK_VALUES = [3, 4, 5, 6, 7, 8, 9, 10];
const SUITS = ["spade", "heart", "diamond", "club"];
const EXCLUDED_CARD = { suit: "spade", value: 10 }; // 10♠ exclu

// Générer le deck (20 cartes)
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

// Distribuer 5 cartes à chaque joueur
function dealCards(deck: Card[]): { hand1: Card[], hand2: Card[] } {
  return {
    hand1: deck.slice(0, 5),
    hand2: deck.slice(5, 10),
  };
}

// Vérifier victoire automatique
function checkAutoWin(hand: Card[]): string | null {
  const sum = hand.reduce((acc, card) => acc + card.value, 0);
  if (sum < 21) return "main_faible";
  
  const sevens = hand.filter(card => card.value === 7);
  if (sevens.length >= 3) return "triple_7";
  
  return null;
}

// Vérifier si le joueur peut jouer cette carte
function isValidPlay(hand: Card[], card: Card, leadSuit: string | null): boolean {
  if (!leadSuit) return true; // Premier à jouer
  
  const hasSuit = hand.some(c => c.suit === leadSuit);
  if (hasSuit) {
    return card.suit === leadSuit; // Doit suivre
  }
  return true; // Peut défausser n'importe quoi
}

// Déterminer le gagnant du tour
function getTurnWinner(play1: Play, play2: Play, leadSuit: string): Play {
  // Si un joueur n'a pas suivi, il perd
  if (play1.card.suit !== leadSuit && play2.card.suit === leadSuit) {
    return play2;
  }
  if (play2.card.suit !== leadSuit && play1.card.suit === leadSuit) {
    return play1;
  }
  // Les deux ont suivi (ou les deux ont défaussé) : plus haute carte gagne
  return play1.card.value > play2.card.value ? play1 : play2;
}

// Calculer le multiplicateur Kora
function calculateKoraMultiplier(turnResults: TurnResult[]): number {
  const lastThree = turnResults.slice(-3);
  
  // Triple Kora : tours 3, 4, 5 gagnés avec des 3
  if (lastThree.length === 3 &&
      lastThree.every(t => t.winningCard.value === 3)) {
    return 8;
  }
  
  // Double Kora : tours 4, 5 gagnés avec des 3
  const lastTwo = turnResults.slice(-2);
  if (lastTwo.length === 2 &&
      lastTwo.every(t => t.winningCard.value === 3)) {
    return 4;
  }
  
  // Kora simple : tour 5 gagné avec un 3
  const lastTurn = turnResults[4];
  if (lastTurn && lastTurn.winningCard.value === 3) {
    return 2;
  }
  
  return 1;
}
```

### 5.2 Logique IA

```typescript
// convex/ai.ts - Agent IA

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
      // Joue aléatoirement parmi les cartes jouables
      return randomChoice(playableCards);
    
    case "medium":
      // Stratégie basique : garder les grosses cartes pour la fin
      if (turn < 4) {
        return getLowestCard(playableCards);
      }
      return getHighestCard(playableCards);
    
    case "hard":
      // Stratégie avancée
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
  
  // Tour 5 : tout donner pour gagner
  if (turn === 5) {
    // Si on a un 3 jouable et qu'on peut gagner avec, le jouer (Kora)
    const three = playable.find(c => c.value === 3);
    if (three && canWinWith(three, leadSuit)) {
      return three;
    }
    return getHighestCard(playable);
  }
  
  // Tours 3-4 : garder les 3 si possible pour le Kora
  if (turn >= 3) {
    const nonThrees = playable.filter(c => c.value !== 3);
    if (nonThrees.length > 0) {
      return getHighestCard(nonThrees);
    }
  }
  
  // Tours 1-2 : jouer les cartes faibles
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
// src/components/game/PlayingCard.tsx

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
// src/hooks/useGame.ts

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useGame(matchId: string) {
  // État du match en temps réel
  const match = useQuery(api.matches.get, { matchId });
  const myHand = useQuery(api.hands.getMyHand, { matchId });
  const plays = useQuery(api.plays.getByTurn, { matchId, turn: match?.currentTurn });
  const turnResults = useQuery(api.turnResults.getByMatch, { matchId });
  
  // Actions
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
// src/hooks/useMatchmaking.ts

export function useMatchmaking() {
  const queueStatus = useQuery(api.matchmaking.getMyStatus);
  
  const joinQueue = useMutation(api.matchmaking.join);
  const leaveQueue = useMutation(api.matchmaking.leave);
  
  return {
    status: queueStatus?.status,        // "idle" | "searching" | "found" | "ready"
    opponent: queueStatus?.opponent,
    matchId: queueStatus?.matchId,
    joinQueue: (betAmount) => joinQueue({ betAmount }),
    leaveQueue,
    timeInQueue: queueStatus?.joinedAt 
      ? Date.now() - queueStatus.joinedAt 
      : 0,
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
|------------------|----------------|-------------------|
| Normale | x1 | 180 Kora |
| Kora simple | x2 | 360 Kora |
| Double Kora | x4 | 720 Kora |
| Triple Kora | x8 | 1440 Kora |

---

## 9. Sécurité

### 9.1 Principes

| Règle | Implémentation |
|-------|----------------|
| Client = Vue seulement | Le client affiche et envoie des intentions |
| Serveur = Autorité | Convex valide toutes les actions |
| Pas de triche | Deck, shuffle, validation côté Convex |
| Pas de manipulation | Gains calculés et versés par le serveur |

### 9.2 Validations Convex

```typescript
// Chaque mutation valide :
// 1. L'utilisateur est authentifié
// 2. C'est bien son tour
// 3. La carte est dans sa main
// 4. La carte respecte l'obligation de suivre
// 5. Le match est en cours
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
