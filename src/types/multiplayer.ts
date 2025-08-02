// Types pour le système multi-joueur
export type GamePhase =
  | "waiting" // En attente d'adversaire
  | "playing" // Partie en cours
  | "my_turn" // C'est mon tour
  | "opponent_turn" // Tour de l'adversaire
  | "ended"; // Partie terminée

export type RoomStatus = "waiting" | "playing" | "ended";

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  hostUsername: string;
  status: RoomStatus;
  maxPlayers: number;
  currentPlayers: number;
  gameMode: "AI" | "ONLINE";
  bet: number;
  maxRounds: number;
  isPrivate: boolean;
  password?: string;
  createdAt: Date;
  gameId?: string; // ID de la partie une fois commencée
}

export interface RoomPlayer {
  id: string;
  username: string;
  koras: number;
  isReady: boolean;
  isHost: boolean;
  joinedAt: Date;
}

export interface MultiplayerGameState {
  roomId: string;
  gameId: string;
  players: RoomPlayer[];
  currentPhase: GamePhase;
  gameState?: any; // GameState de notre engine
  lastUpdate: Date;
  version: number; // Pour détecter les changements
}

export interface GameEvent {
  id: string;
  gameId: string;
  playerId: string;
  type:
    | "CARD_PLAYED"
    | "TURN_CHANGE"
    | "GAME_START"
    | "GAME_END"
    | "PLAYER_JOIN"
    | "PLAYER_LEAVE";
  payload: any;
  timestamp: Date;
  processed: boolean;
}

export interface PollingConfig {
  waiting: number; // 5000ms - recherche d'adversaire
  playing: number; // 1000ms - partie en cours
  my_turn: number; // 500ms - c'est mon tour
  opponent_turn: number; // 2000ms - tour adversaire
  ended: false; // Pas de polling
}

export const POLLING_INTERVALS: PollingConfig = {
  waiting: 5000,
  playing: 1000,
  my_turn: 500,
  opponent_turn: 2000,
  ended: false,
};

// Types pour les mutations tRPC
export interface CreateRoomInput {
  name: string;
  bet: number;
  maxRounds: number;
  isPrivate?: boolean;
  password?: string;
}

export interface JoinRoomInput {
  roomId: string;
  password?: string;
}

export interface PlayCardInput {
  gameId: string;
  cardId: string;
  roomId: string;
}

export interface GetRoomUpdatesInput {
  roomId: string;
  lastVersion?: number;
}
