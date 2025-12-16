import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";

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

export function useSound() {
  const [isLoaded, setIsLoaded] = useState(false);

  const cardPlayPlayer = useAudioPlayer(cardPlaySound);
  const cardSelectPlayer = useAudioPlayer(cardSelectSound);
  const victoryPlayer = useAudioPlayer(victorySound);
  const defeatPlayer = useAudioPlayer(defeatSound);
  const koraPlayer = useAudioPlayer(koraSound);
  const koraDoublePlayer = useAudioPlayer(koraDoubleSound);
  const koraTriplePlayer = useAudioPlayer(koraTripleSound);
  const autoVictoryPlayer = useAudioPlayer(autoVictorySound);
  const gameStartPlayer = useAudioPlayer(gameStartSound);
  const gameEndPlayer = useAudioPlayer(gameEndSound);
  const turnChangePlayer = useAudioPlayer(turnChangeSound);
  const buttonClickPlayer = useAudioPlayer(buttonClickSound);
  const confirmationPlayer = useAudioPlayer(confirmationSound);
  const winMoneyPlayer = useAudioPlayer(winMoneySound);

  const players = {
    cardPlay: cardPlayPlayer,
    cardSelect: cardSelectPlayer,
    victory: victoryPlayer,
    defeat: defeatPlayer,
    kora: koraPlayer,
    koraDouble: koraDoublePlayer,
    koraTriple: koraTriplePlayer,
    autoVictory: autoVictoryPlayer,
    gameStart: gameStartPlayer,
    gameEnd: gameEndPlayer,
    turnChange: turnChangePlayer,
    buttonClick: buttonClickPlayer,
    confirmation: confirmationPlayer,
    winMoney: winMoneyPlayer,
  };

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "mixWithOthers",
          interruptionModeAndroid: "duckOthers",
        });

        cardPlayPlayer.volume = 0.7;
        cardSelectPlayer.volume = 0.7;
        victoryPlayer.volume = 0.7;
        defeatPlayer.volume = 0.7;
        koraPlayer.volume = 0.7;
        koraDoublePlayer.volume = 0.7;
        koraTriplePlayer.volume = 0.7;
        autoVictoryPlayer.volume = 0.7;
        gameStartPlayer.volume = 0.7;
        gameEndPlayer.volume = 0.7;
        turnChangePlayer.volume = 0.7;
        buttonClickPlayer.volume = 0.7;
        confirmationPlayer.volume = 0.7;
        winMoneyPlayer.volume = 0.7;

        setIsLoaded(true);
      } catch (error) {
        console.warn("Failed to initialize audio:", error);
        setIsLoaded(false);
      }
    };

    initializeAudio();
  }, [
    cardPlayPlayer,
    cardSelectPlayer,
    victoryPlayer,
    defeatPlayer,
    koraPlayer,
    koraDoublePlayer,
    koraTriplePlayer,
    autoVictoryPlayer,
    gameStartPlayer,
    gameEndPlayer,
    turnChangePlayer,
    buttonClickPlayer,
    confirmationPlayer,
    winMoneyPlayer,
  ]);

  const playSound = async (type: SoundType) => {
    try {
      const player = players[type];
      if (player && isLoaded) {
        try {
          player.seekTo(0);
          player.play();
        } catch (error: any) {
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
