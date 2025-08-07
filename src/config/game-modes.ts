import type { GameMode } from "@prisma/client";
import {
  IconRobot,
  IconUsers,
  IconUserPlus,
  type Icon,
} from "@tabler/icons-react";

export interface GameModeOption {
  id: GameMode;
  title: string;
  description: string;
  icon: Icon;
  color: string;
  difficulty: string;
  players: string;
  available: boolean;
}

export const GAME_MODES: GameModeOption[] = [
  {
    id: "AI",
    title: "Contre l'IA",
    description:
      "Affrontez une intelligence artificielle avec 3 niveaux de difficulté",
    icon: IconRobot,
    color: "from-purple-500 to-purple-600",
    difficulty: "Variable",
    players: "1 joueur",
    available: true,
  },
  {
    id: "ONLINE",
    title: "Multijoueur en ligne",
    description: "Jouez contre d'autres joueurs en ligne",
    icon: IconUsers,
    color: "from-blue-500 to-blue-600",
    difficulty: "Humain",
    players: "2 joueurs",
    available: true, // Pas encore implémenté
  },
  {
    id: "LOCAL",
    title: "Avec un ami",
    description: "Jouez à deux sur le même appareil",
    icon: IconUserPlus,
    color: "from-green-500 to-green-600",
    difficulty: "Humain",
    players: "2 joueurs",
    available: false, // Pas encore implémenté
  },
];

export interface AIDifficultyOption {
  id: "easy" | "medium" | "hard";
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}

export const AI_DIFFICULTIES: AIDifficultyOption[] = [
  {
    id: "easy",
    label: "🟢 Facile",
    shortLabel: "Facile",
    description: "IA basique qui joue aléatoirement",
    color: "bg-green-500",
  },
  {
    id: "medium",
    label: "🟡 Moyen",
    shortLabel: "Moyen",
    description: "IA intelligente avec stratégies de base",
    color: "bg-yellow-500",
  },
  {
    id: "hard",
    label: "🔴 Difficile",
    shortLabel: "Difficile",
    description: "IA experte avec stratégies avancées",
    color: "bg-red-500",
  },
];
