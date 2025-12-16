# Documentation Backend Convex - Kora Game

## Table des matières
1. [Architecture générale](#architecture-générale)
2. [Schema de la base de données](#schema-de-la-base-de-données)
3. [Constantes et Enums](#constantes-et-enums)
4. [Validators](#validators)
5. [Game Engine](#game-engine)
6. [Mutations et Queries](#mutations-et-queries)
7. [AI Player](#ai-player)
8. [Authentification](#authentification)
9. [Flux de jeu](#flux-de-jeu)

---

## Architecture générale

Le backend Convex est organisé en plusieurs modules:

- **schema.ts** - Définit la structure de la base de données
- **constants.ts** - Enums et constantes du jeu
- **validators.ts** - Validateurs Convex pour les types
- **gameEngine.ts** - Logique pure du jeu (fonctions sans effets de bord)
- **games.ts** - Mutations et queries pour les parties
- **aiPlayer.ts** - Logique de l'IA
- **users.ts** - Gestion des utilisateurs
- **chat.ts** - Système de chat (si activé)
- **auth.config.ts** - Configuration Clerk auth

---

## Schema de la base de données

### Table `users`

Stocke les informations des utilisateurs.

```typescript
{
  username: string;          // Nom d'utilisateur
  email: string;             // Email
  clerkId: string;           // ID Clerk pour l'auth
  avatarUrl?: string;        // URL de l'avatar
  balance: number;           // Solde en monnaie réelle
  currency: Currency;        // EUR ou XAF
  createdAt: number;         // Timestamp de création
}
```

**Index:**
- `by_clerk_id` - Pour récupérer un user par son clerkId
- `by_email` - Pour récupérer un user par email

### Table `games`

Stocke toutes les parties de jeu.

```typescript
{
  gameId: string;                    // ID unique de la partie (format: game-{uuid})
  seed: string;                      // Seed pour la génération aléatoire
  version: number;                   // Numéro de version (incrémenté à chaque update)
  status: GameStatus;                // WAITING | PLAYING | ENDED
  hostId: Id<"users"> | string;      // ID de l'hôte
  mode: GameMode;                    // AI | ONLINE | LOCAL
  maxPlayers: number;                // Nombre max de joueurs (2 pour Kora)
  maxRounds: number;                 // Nombre de rounds (5 par défaut)
  currentRound: number;              // Round actuel (1-5)

  // Players
  players: Player[];                 // Tableau des joueurs
  currentTurnPlayerId: Id<"users"> | string | null;  // ID du joueur dont c'est le tour
  hasHandPlayerId: Id<"users"> | string | null;      // ID du joueur qui a "la main"

  // Cards
  playedCards: PlayedCard[];         // Cartes jouées dans la partie

  // Bet
  bet: {
    amount: number;                  // Montant de la mise
    currency: Currency;              // EUR ou XAF
  };

  // Game end
  winnerId: Id<"users"> | string | null;  // ID du gagnant
  victoryType: VictoryType | null;   // Type de victoire
  endReason: string | null;          // Raison de fin de partie

  // History
  history: GameHistory[];            // Historique complet pour reconstituer la partie

  // Multiplayer
  isPrivate: boolean;                // Partie privée ou publique
  joinCode?: string;                 // Code pour rejoindre (optionnel)

  // AI
  aiDifficulty: AIDifficulty | null; // Difficulté de l'IA (si mode AI)

  // Timestamps
  startedAt: number;                 // Timestamp de début
  endedAt: number | null;            // Timestamp de fin
  lastUpdatedAt: number;             // Dernière mise à jour
}
```

**Index:**
- `by_game_id` - Pour récupérer une partie par gameId
- `by_host_id` - Pour récupérer les parties d'un hôte
- `by_join_code` - Pour rejoindre via un code

### Sous-types

#### Player
```typescript
{
  userId: Id<"users"> | null;        // ID user (null pour AI)
  botId?: string;                    // ID du bot (ai-bindi, ai-ndoss, ai-bandi)
  username: string;                  // Nom du joueur
  type: "user" | "ai";               // Type de joueur
  isConnected: boolean;              // Statut de connexion
  avatar?: string;                   // URL de l'avatar
  hand?: Card[];                     // Main du joueur (cartes)
  balance: number;                   // Solde du joueur
  aiDifficulty?: AIDifficulty;       // Difficulté IA (si AI)
  isThinking?: boolean;              // IA en train de réfléchir
}
```

#### Card
```typescript
{
  suit: "hearts" | "diamonds" | "clubs" | "spades";  // Couleur
  rank: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";  // Valeur
  playable: boolean;                 // Carte jouable ou non
  id: string;                        // ID unique de la carte
}
```

**Note:** Le jeu Kora utilise uniquement les cartes de 3 à 10, excluant le 10 de pique (31 cartes).

#### PlayedCard
```typescript
{
  card: Card;                        // La carte jouée
  playerId: Id<"users"> | string;    // ID du joueur qui l'a jouée
  round: number;                     // Numéro du round
  timestamp: number;                 // Timestamp
}
```

#### GameHistory
```typescript
{
  action: GameHistoryAction;         // Type d'action
  timestamp: number;                 // Timestamp
  playerId?: Id<"users"> | string;   // ID du joueur (optionnel)
  data?: {                           // Données additionnelles
    cardId?: string;
    cardSuit?: Suit;
    cardRank?: Rank;
    round?: number;
    winnerId?: Id<"users"> | string;
    koraType?: string;
    multiplier?: number;
    message?: string;
  };
}
```

---

## Constantes et Enums

### GameStatus
État de la partie:
- `WAITING` - En attente de joueurs
- `PLAYING` - Partie en cours
- `ENDED` - Partie terminée

### GameMode
Mode de jeu:
- `AI` - Contre l'ordinateur
- `ONLINE` - Multijoueur en ligne
- `LOCAL` - Multijoueur local (non implémenté)

### AIDifficulty
Difficulté de l'IA:
- `EASY` - Facile (Bindi du Tierqua)
- `MEDIUM` - Moyen (Le Ndoss)
- `HARD` - Difficile (Le Grand Bandi)

### PlayerType
Type de joueur:
- `USER` - Joueur humain
- `AI` - Intelligence artificielle

### Currency
Devises supportées:
- `EUR` - Euro (format: 2 décimales)
- `XAF` - Franc CFA (format: 0 décimale)

### Suit (Couleurs)
- `HEARTS` - Cœurs
- `DIAMONDS` - Carreaux
- `CLUBS` - Trèfles
- `SPADES` - Piques

### Rank (Valeurs)
- `THREE` à `TEN` - Cartes de 3 à 10

### VictoryType
Types de victoire:
- `NORMAL` - Victoire normale
- `AUTO_SUM` - Victoire automatique (somme = 21)
- `KORA` - Kora (3 cartes identiques)
- `KORA_BINDI` - Kora Bindi (3x3)
- `KORA_MOUGOU` - Kora Mougou (3x5)
- `CONSECUTIVE_THREES` - 3 fois trois consécutifs

### GameHistoryAction
Actions dans l'historique:
- `GAME_CREATED` - Partie créée
- `GAME_STARTED` - Partie démarrée
- `CARD_PLAYED` - Carte jouée
- `ROUND_WON` - Round gagné
- `KORA_ACHIEVED` - Kora réalisé
- `GAME_ENDED` - Partie terminée
- `PLAYER_JOINED` - Joueur rejoint
- `PLAYER_LEFT` - Joueur parti

### Constantes AI

```typescript
// IDs des bots par difficulté
AIBotIds = {
  [AIDifficulty.EASY]: "ai-bindi",
  [AIDifficulty.MEDIUM]: "ai-ndoss",
  [AIDifficulty.HARD]: "ai-bandi",
}

// Noms des bots
AIBotNames = {
  [AIDifficulty.EASY]: "Bindi du Tierqua",
  [AIDifficulty.MEDIUM]: "Le Ndoss",
  [AIDifficulty.HARD]: "Le Grand Bandi",
}
```

---

## Validators

Les validators Convex permettent de valider les données côté serveur. Ils sont construits à partir des enums.

```typescript
// Fonction helper pour créer des validators d'enum
function enumValidator<T extends Record<string, string>>(enumObj: T)

// Validators disponibles
export const gameStatusValidator = enumValidator(GameStatus);
export const gameModeValidator = enumValidator(GameMode);
export const playerTypeValidator = enumValidator(PlayerType);
export const aiDifficultyValidator = enumValidator(AIDifficulty);
export const currencyValidator = enumValidator(Currency);
export const suitValidator = enumValidator(Suit);
export const rankValidator = enumValidator(Rank);
export const victoryTypeValidator = enumValidator(VictoryType);
export const gameHistoryActionValidator = enumValidator(GameHistoryAction);

// Validators d'objets
export const cardValidator = v.object({...});
export const playerValidator = v.object({...});
export const playedCardValidator = v.object({...});
export const gameHistoryValidator = v.object({...});
export const betValidator = v.object({...});
```

---

## Game Engine

Le Game Engine contient toute la logique pure du jeu (fonctions sans effets de bord).

### Types exportés

```typescript
export type Game = Doc<"games">;           // Type de partie
export type User = Doc<"users">;           // Type d'utilisateur
export type Player = Game["players"][number];  // Type de joueur
export type PlayedCard = Game["playedCards"][number];  // Carte jouée
export type Card = NonNullable<Player["hand"]>[number];  // Carte
export type GameHistory = Game["history"][number];  // Entrée d'historique
```

### Fonctions principales

#### Deck Management

```typescript
// Crée un deck de 31 cartes (3-10, sans 10 de pique)
createDeck(seed: string): Card[]

// Mélange un deck
shuffleDeck(deck: Card[]): Card[]
```

#### Card Values

```typescript
// Retourne la valeur numérique d'une carte
getCardValue(rank: Card["rank"]): number

// Calcule la somme d'une main
calculateHandSum(cards: Card[]): number
```

#### Game Logic

```typescript
// Vérifie si une carte peut être jouée
canPlayCard(cardId: string, player: Player, game: Game): boolean

// Met à jour les cartes jouables pour un joueur
updatePlayableCards(game: Game): Game

// Détermine le gagnant d'un round
determineRoundWinner(playedCards: PlayedCard[]): Id<"users"> | string

// Vérifie les victoires automatiques
checkAutomaticVictory(player: Player): {
  hasVictory: boolean;
  victoryType?: VictoryType;
  multiplier: number
}

// Compte les trois consécutifs
countConsecutiveThrees(cards: Card[]): number

// Calcule le multiplicateur de Kora
calculateKoraMultiplier(cards: Card[]): number

// Retourne le type de Kora
getKoraType(cards: Card[]): string

// Met à jour le tour du joueur
updatePlayerTurn(game: Game): Id<"users"> | string | null

// Valide une action de jeu
validatePlayCardAction(
  cardId: string,
  playerId: Id<"users"> | string,
  game: Game
): { valid: boolean; error?: string }
```

#### Player Management

```typescript
// Retourne l'ID d'un joueur (gère userId, botId, AI)
getPlayerId(player: Player): Id<"users"> | string

// Retourne l'ID d'un bot AI
getAIBotId(difficulty: AIDifficulty): string

// Retourne le nom d'un bot AI
getAIBotUsername(difficulty: AIDifficulty): string
```

#### History Management

```typescript
// Ajoute une entrée à l'historique (incrémente version et lastUpdatedAt)
addHistoryEntry(
  game: Game,
  action: GameHistoryAction,
  playerId?: Id<"users"> | string,
  data?: GameHistory["data"]
): Game
```

### Règles du jeu Kora

1. **Objectif**: Gagner 3 rounds sur 5
2. **Distribution**: 5 cartes par joueur à chaque round
3. **Tour de jeu**:
   - Le joueur avec "la main" joue en premier
   - L'adversaire doit jouer une carte de même couleur si possible
   - Sinon, il peut jouer n'importe quelle carte
4. **Gagnant du round**: Carte la plus forte de la couleur demandée
5. **Victoires spéciales**:
   - **Kora**: 3 cartes identiques (x2 la mise)
   - **Kora Bindi**: 3x3 (x3 la mise)
   - **Kora Mougou**: 3x5 (x5 la mise)
   - **Somme = 21**: Victoire automatique
   - **3 fois trois consécutifs**: Victoire automatique

---

## Mutations et Queries

### Queries (Lecture)

#### `getGame`
Récupère une partie par son gameId.
```typescript
args: { gameId: string }
returns: Game | null
```

#### `getGameById`
Récupère une partie par son _id Convex.
```typescript
args: { id: Id<"games"> }
returns: Game | null
```

#### `getPlayerGames`
Récupère toutes les parties d'un joueur (hôte ou participant).
```typescript
args: { userId: Id<"users"> }
returns: Game[]
```

#### `getGameByJoinCode`
Récupère une partie par son code de join.
```typescript
args: { joinCode: string }
returns: Game | null
```

#### `getAvailableGames`
Récupère les parties publiques disponibles à rejoindre.
```typescript
args: { userId?: Id<"users"> }
returns: Game[]
// Filtre: mode=ONLINE, status=WAITING, isPrivate=false, pas pleine, user pas dedans
```

### Mutations (Écriture)

#### `createGame`
Crée une nouvelle partie.
```typescript
args: {
  mode: GameMode;
  hostId: Id<"users">;
  betAmount: number;
  currency: Currency;
  maxRounds?: number;         // Default: 5
  aiDifficulty?: AIDifficulty;
  roomName?: string;
  isPrivate?: boolean;        // Default: false
  joinCode?: string;
  maxPlayers?: number;        // Default: 2
}
returns: { gameId: string }
```

**Comportement:**
- Génère un gameId unique
- Crée le deck de 31 cartes
- Ajoute l'hôte comme premier joueur
- Si mode AI, ajoute le bot comme second joueur
- Ajoute une entrée d'historique `GAME_CREATED`

#### `joinGame`
Rejoint une partie existante.
```typescript
args: {
  gameId: string;
  userId: Id<"users">;
}
returns: { success: boolean }
```

**Vérifications:**
- Partie existe
- Status = WAITING
- Pas pleine
- Joueur pas déjà dedans

#### `startGame`
Démarre une partie.
```typescript
args: { gameId: string }
returns: void
```

**Comportement:**
- Vérifie que la partie est complète (2 joueurs)
- Distribue 5 cartes à chaque joueur
- Choisit aléatoirement qui a "la main"
- Met le status à PLAYING
- Met à jour les cartes jouables
- Ajoute une entrée `GAME_STARTED`
- Si mode AI et c'est le tour de l'IA, schedule `triggerAITurn`

#### `playCard`
Joue une carte (pour joueurs humains).
```typescript
args: {
  gameId: string;
  cardId: string;
  playerId: Id<"users">;
}
returns: void
```

**Comportement:**
- Valide l'action avec `validatePlayCardAction`
- Appelle `playCardInternal` pour la logique

#### `playCardInternal`
Logique interne de jeu de carte (utilisée par playCard et AI).
```typescript
args: {
  gameId: string;
  cardId: string;
  playerId: Id<"users"> | string;
}
returns: void
```

**Comportement:**
1. Valide l'action
2. Retire la carte de la main du joueur
3. Ajoute la carte aux playedCards
4. Ajoute une entrée `CARD_PLAYED` à l'historique
5. Si 2 cartes jouées dans le round:
   - Détermine le gagnant du round
   - Ajoute une entrée `ROUND_WON`
   - Donne "la main" au gagnant
   - Vérifie les victoires automatiques
   - Si victoire: termine la partie
   - Sinon si 5 rounds ou joueur sans cartes: termine la partie
   - Sinon: incrémente le round et distribue 5 nouvelles cartes
6. Met à jour le tour du joueur
7. Met à jour les cartes jouables
8. Si mode AI et tour de l'IA: schedule `triggerAITurn`

### Internal Mutations (Serveur uniquement)

#### `triggerAITurn`
Déclenche le tour de l'IA après un délai.
```typescript
args: { gameId: string }
returns: void
```

**Comportement:**
- Vérifie que c'est bien le tour de l'IA
- Appelle `chooseCard` de l'IA
- Appelle `playCardInternal` avec la carte choisie

---

## AI Player

L'IA est implémentée dans `aiPlayer.ts` avec différents niveaux de difficulté.

### Fonction principale

```typescript
export function chooseCard(
  hand: Card[],
  playedCards: PlayedCard[],
  currentRound: number,
  difficulty: AIDifficulty = AIDifficulty.MEDIUM
): string
```

### Stratégies par difficulté

#### EASY (Bindi du Tierqua)
- Joue aléatoirement parmi les cartes jouables
- 30% de chance de jouer la plus faible carte jouable

#### MEDIUM (Le Ndoss)
- Si adversaire a joué: essaie de gagner avec la carte la plus faible possible
- Sinon: joue la carte moyenne
- 20% de randomness

#### HARD (Le Grand Bandi)
- Stratégie avancée avec gestion de score
- Évalue chaque carte avec un système de points
- Prend en compte:
  - La possibilité de gagner le round
  - L'économie de cartes fortes pour plus tard
  - Les Koras potentiels
  - La somme des cartes (objectif 21)
- 5% de randomness seulement

---

## Authentification

L'authentification utilise Clerk.

### Configuration (`auth.config.ts`)

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

### Users Management (`users.ts`)

#### `current`
Retourne l'utilisateur connecté actuel.
```typescript
returns: User | null
```

#### `upsertFromClerk`
Crée ou met à jour un utilisateur depuis Clerk.
```typescript
args: { clerkUser: ClerkUserData }
returns: Id<"users">
```

#### `updateUser`
Met à jour les informations d'un utilisateur.
```typescript
args: {
  userId: Id<"users">;
  updates: Partial<User>;
}
```

---

## Flux de jeu

### 1. Création de partie

**Mode AI:**
```
User → createGame(mode=AI, aiDifficulty)
→ Crée partie avec bot
→ startGame()
→ Distribue cartes
→ Si tour IA: triggerAITurn()
```

**Mode ONLINE:**
```
Host → createGame(mode=ONLINE, isPrivate?, joinCode?)
→ Crée partie en WAITING
→ Autre joueur → joinGame(gameId)
→ Host → startGame()
→ Distribue cartes
```

### 2. Déroulement d'un round

```
Tour Joueur 1:
→ playCard(cardId, playerId)
→ Carte ajoutée à playedCards
→ Met à jour currentTurnPlayerId

Tour Joueur 2:
→ playCard(cardId, playerId)
→ Carte ajoutée à playedCards
→ determineRoundWinner()
→ Vérifie victoires automatiques
→ Si pas de victoire:
  → Incrémente currentRound
  → Distribue 5 nouvelles cartes
  → Met à jour hasHandPlayerId
```

### 3. Fin de partie

**Conditions:**
- Un joueur a gagné 3 rounds
- Un joueur n'a plus de cartes
- Victoire automatique (Kora, somme=21, etc.)
- currentRound >= 5

**Actions:**
- Met status à ENDED
- Enregistre winnerId et victoryType
- Ajoute entrée `GAME_ENDED` à l'historique
- Met à jour le balance des joueurs

---

## Fonctionnalités avancées

### System de versioning
Chaque modification de partie incrémente `version` et met à jour `lastUpdatedAt`. Utile pour:
- Détection de conflits
- Synchronisation temps réel
- Débogage

### History complète
Le champ `history` permet de:
- Reconstituer toute la partie
- Afficher un replay
- Débogage et analytics
- Vérification anti-triche

### Gestion des IDs
La fonction `getPlayerId()` unifie la récupération d'ID:
- Pour humains: retourne `userId`
- Pour IA: retourne `botId` (ai-bindi, ai-ndoss, ai-bandi)
- Fallback: génère l'ID depuis `aiDifficulty`

### Reactive queries
Toutes les queries Convex sont réactives:
- Les composants React se mettent à jour automatiquement
- Pas besoin de polling ou WebSockets manuels
- Synchronisation temps réel entre joueurs

---

## Best Practices

1. **Toujours utiliser les validators** pour les mutations
2. **Utiliser getPlayerId()** au lieu d'accéder directement userId
3. **Ajouter des entrées d'historique** pour chaque action importante
4. **Incrémenter version** via `addHistoryEntry()`
5. **Vérifier le status de la partie** avant chaque action
6. **Gérer les cas AI** dans les mutations avec `ctx.scheduler`
7. **Ne jamais exposer les mains des joueurs** dans les queries publiques

---

## Exemples d'utilisation

### Créer une partie AI

```typescript
const result = await createGame({
  mode: GameMode.AI,
  hostId: user._id,
  betAmount: 100,
  currency: Currency.XAF,
  aiDifficulty: AIDifficulty.MEDIUM,
});
// → { gameId: "game-abc123..." }

await startGame({ gameId: result.gameId });
```

### Rejoindre une partie en ligne

```typescript
// Récupérer les parties disponibles
const availableGames = await getAvailableGames({ userId: user._id });

// Rejoindre une partie
await joinGame({
  gameId: availableGames[0].gameId,
  userId: user._id,
});
```

### Jouer une carte

```typescript
await playCard({
  gameId: "game-abc123...",
  cardId: "hearts-5-seed-0",
  playerId: user._id,
});
```

---

## Débogage

### Vérifier l'état d'une partie

```typescript
const game = await getGame({ gameId: "game-abc123..." });
console.log("Status:", game.status);
console.log("Round:", game.currentRound);
console.log("Turn:", game.currentTurnPlayerId);
console.log("Players:", game.players.map(p => ({
  username: p.username,
  cards: p.hand?.length,
})));
```

### Historique d'une partie

```typescript
game.history.forEach(entry => {
  console.log(`[${new Date(entry.timestamp).toISOString()}]`,
    entry.action,
    entry.data?.message || ""
  );
});
```

---

## Support

Pour toute question sur le backend Convex:
- [Documentation Convex](https://docs.convex.dev)
- [Documentation TypeScript Enums avec Convex](https://www.convex.dev/typescript/core-concepts/enums-constants/typescript-enum)
