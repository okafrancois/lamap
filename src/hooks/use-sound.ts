"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export type SoundType =
  // Navigation
  | "click"
  | "hover"
  | "page_transition"
  | "modal_open"
  | "modal_close"
  // Game actions
  | "card_flip"
  | "card_play"
  | "card_select"
  | "game_start"
  | "game_end"
  | "turn_change"
  | "ai_thinking"
  // Special cases
  | "victory"
  | "defeat"
  | "kora_simple"
  | "kora_double"
  | "kora_triple"
  | "auto_victory"
  | "shuffle_cards";

interface SoundConfig {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

interface UseSoundOptions {
  volume?: number;
  enabled?: boolean;
  preloadAll?: boolean;
}

// Mappage des types de sons vers leurs fichiers
const SOUND_FILES: Record<SoundType, string> = {
  // Navigation
  click: "/sounds/navigation/click.mp3",
  hover: "/sounds/navigation/hover.mp3",
  page_transition: "/sounds/navigation/transition.mp3",
  modal_open: "/sounds/navigation/modal-open.mp3",
  modal_close: "/sounds/navigation/modal-close.mp3",

  // Game actions
  card_flip: "/sounds/game/card-flip.mp3",
  card_play: "/sounds/game/card-play.mp3",
  card_select: "/sounds/game/card-select.mp3",
  game_start: "/sounds/game/game-start.mp3",
  game_end: "/sounds/game/game-end.mp3",
  turn_change: "/sounds/game/turn-change.mp3",
  ai_thinking: "/sounds/game/ai-thinking.mp3",
  shuffle_cards: "/sounds/game/shuffle.mp3",

  // Special cases
  victory: "/sounds/special/victory.mp3",
  defeat: "/sounds/special/defeat.mp3",
  kora_simple: "/sounds/special/kora-simple.mp3",
  kora_double: "/sounds/special/kora-double.mp3",
  kora_triple: "/sounds/special/kora-triple.mp3",
  auto_victory: "/sounds/special/auto-victory.mp3",
};

export function useSound(options: UseSoundOptions = {}) {
  const [settings, setSettings] = useState({ volume: 0.7, enabled: true });

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem("kora-sound-volume");
    const savedEnabled = localStorage.getItem("kora-sound-enabled");

    setSettings({
      volume: savedVolume ? parseInt(savedVolume) / 100 : 0.7,
      enabled: savedEnabled ? savedEnabled === "true" : true,
    });
  }, []);

  const {
    volume: globalVolume = settings.volume,
    enabled = settings.enabled,
    preloadAll = true,
  } = options;

  const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadedSounds, setLoadedSounds] = useState<Set<SoundType>>(new Set());

  // Créer ou récupérer un élément audio
  const getAudioElement = useCallback(
    (soundType: SoundType): HTMLAudioElement => {
      if (!audioCache.current.has(soundType)) {
        const audio = new Audio(SOUND_FILES[soundType]);
        audio.volume = globalVolume;
        audio.preload = "auto";

        // Gestion des erreurs
        audio.addEventListener("error", (e) => {
          console.warn(`Erreur lors du chargement du son ${soundType}:`, e);
        });

        audio.addEventListener("canplaythrough", () => {
          setLoadedSounds((prev) => new Set([...prev, soundType]));
        });

        audioCache.current.set(soundType, audio);
      }

      return audioCache.current.get(soundType)!;
    },
    [globalVolume],
  );

  // Précharger tous les sons
  const preloadSounds = useCallback(async () => {
    if (!enabled || !preloadAll) return;

    setIsLoading(true);

    try {
      const soundTypes = Object.keys(SOUND_FILES) as SoundType[];

      // Créer les éléments audio
      soundTypes.forEach((soundType) => {
        getAudioElement(soundType);
      });
    } catch (error) {
      console.warn("Erreur lors du préchargement des sons:", error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, preloadAll, getAudioElement]);

  // Jouer un son
  const playSound = useCallback(
    async (soundType: SoundType, config: SoundConfig = {}) => {
      if (!enabled) return;

      try {
        const audio = getAudioElement(soundType);

        // Configurer le son
        audio.volume = config.volume ?? globalVolume;
        audio.loop = config.loop ?? false;

        // Rembobiner si déjà en cours
        audio.currentTime = 0;

        // Jouer le son
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          void playPromise.catch((error) => {
            console.debug(`Son ${soundType} non joué:`, error);
          });
        }
      } catch (error) {
        // Ignorer les erreurs de lecture (ex: interaction utilisateur requise)
        console.debug(`Son ${soundType} non joué:`, error);
      }
    },
    [enabled, globalVolume, getAudioElement],
  );

  // Arrêter un son
  const stopSound = useCallback((soundType: SoundType) => {
    const audio = audioCache.current.get(soundType);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Arrêter tous les sons
  const stopAllSounds = useCallback(() => {
    audioCache.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  // Mettre à jour le volume global
  const setGlobalVolume = useCallback((volume: number) => {
    audioCache.current.forEach((audio) => {
      audio.volume = volume;
    });
  }, []);

  // Précharger au montage
  useEffect(() => {
    void preloadSounds();
  }, [preloadSounds]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopAllSounds();
      audioCache.current.clear();
    };
  }, [stopAllSounds]);

  return {
    playSound,
    stopSound,
    stopAllSounds,
    setGlobalVolume,
    preloadSounds,
    isLoading,
    loadedSounds: Array.from(loadedSounds),
    totalSounds: Object.keys(SOUND_FILES).length,
  };
}
