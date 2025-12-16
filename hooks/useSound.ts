import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";

type SoundType =
  // Sons existants
  | "cardPlay"
  | "victory"
  | "kora"
  | "defeat"
  // Nouveaux sons
  | "cardSelect"
  | "gameStart"
  | "gameEnd"
  | "turnChange"
  | "koraDouble"
  | "koraTriple"
  | "autoVictory"
  | "buttonClick"
  | "confirmation"
  | "winMoney";

// Import des fichiers audio (doivent être statiques pour React Native)
const cardPlaySound = require("../assets/sounds/game/card-play.mp3");
const cardSelectSound = require("../assets/sounds/game/card-select.mp3");
const victorySound = require("../assets/sounds/special/victory.mp3");
const defeatSound = require("../assets/sounds/special/defeat.mp3");
const koraSound = require("../assets/sounds/special/kora-simple.mp3");
const koraDoubleSound = require("../assets/sounds/special/kora-double.mp3");
const koraTripleSound = require("../assets/sounds/special/kora-triple.mp3");
const autoVictorySound = require("../assets/sounds/special/auto-victory.mp3");
const gameStartSound = require("../assets/sounds/game/game-start.mp3");
const gameEndSound = require("../assets/sounds/game/game-end.mp3");
const turnChangeSound = require("../assets/sounds/game/turn-change.mp3");
const buttonClickSound = require("../assets/sounds/ui/click.mp3");
const confirmationSound = require("../assets/sounds/ui/confirmation.mp3");
const winMoneySound = require("../assets/sounds/ui/win-money.mp3");

// Mapping des types de sons aux fichiers
const SOUND_MAP: Record<SoundType, any> = {
  cardPlay: cardPlaySound,
  cardSelect: cardSelectSound,
  victory: victorySound,
  defeat: defeatSound,
  kora: koraSound,
  koraDouble: koraDoubleSound,
  koraTriple: koraTripleSound,
  autoVictory: autoVictorySound,
  gameStart: gameStartSound,
  gameEnd: gameEndSound,
  turnChange: turnChangeSound,
  buttonClick: buttonClickSound,
  confirmation: confirmationSound,
  winMoney: winMoneySound,
};

export function useSound() {
  const [isLoaded, setIsLoaded] = useState(false);
  const playersRef = useRef<
    Record<string, ReturnType<typeof createAudioPlayer>>
  >({});

  const loadSounds = useCallback(async () => {
    try {
      // Configurer le mode audio pour permettre la lecture en arrière-plan
      await setAudioModeAsync({
        playsInSilentMode: true,
      });

      const loadedPlayers: Record<
        string,
        ReturnType<typeof createAudioPlayer>
      > = {};

      // Créer un player pour chaque son
      for (const [type, source] of Object.entries(SOUND_MAP)) {
        try {
          const player = createAudioPlayer(source);
          // Configurer le volume
          player.volume = 0.7;
          loadedPlayers[type] = player;
        } catch (error) {
          console.warn(`Failed to load sound ${type}:`, error);
        }
      }

      playersRef.current = loadedPlayers;
      setIsLoaded(true);
    } catch (error) {
      console.warn("Failed to initialize audio:", error);
      setIsLoaded(false);
    }
  }, []);

  const unloadSounds = useCallback(async () => {
    try {
      for (const player of Object.values(playersRef.current)) {
        try {
          player.release();
        } catch {
          // Ignorer les erreurs de release
        }
      }
      playersRef.current = {};
    } catch (error) {
      console.warn("Failed to unload sounds:", error);
    }
  }, []);

  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, [loadSounds, unloadSounds]);

  const playSound = async (type: SoundType) => {
    try {
      // Jouer le son audio si disponible
      const player = playersRef.current[type];
      if (player && isLoaded) {
        try {
          // Réinitialiser la position et jouer
          player.seekTo(0);
          player.play();
        } catch (error: any) {
          // Ignorer les erreurs silencieusement
          if (!error?.message?.includes("Seeking interrupted")) {
            console.warn(`Failed to play sound ${type}:`, error);
          }
        }
      }

      // Toujours jouer les haptiques en complément
      switch (type) {
        case "cardPlay":
        case "cardSelect":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "victory":
        case "autoVictory":
        case "gameStart":
        case "gameEnd":
        case "confirmation":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          break;
        case "kora":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "koraDouble":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "koraTriple":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "defeat":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          break;
        case "turnChange":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "winMoney":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          break;
        case "buttonClick":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        default:
          break;
      }
    } catch (error) {
      console.warn(`Failed to play sound/haptic ${type}:`, error);
    }
  };

  return { playSound, isLoaded };
}
