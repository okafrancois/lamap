import { BattleZone } from "@/components/game/BattleZone";
import { CardHand } from "@/components/game/CardHand";
import { OpponentZone } from "@/components/game/OpponentZone";
import { TurnPips } from "@/components/game/TurnPips";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/hooks/useGame";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type GameHistoryEntry = {
  action: string;
  timestamp: number;
  playerId?: string;
  data?: {
    cardId?: string;
    cardSuit?: string;
    cardRank?: string;
    round?: number;
    winnerId?: string;
    koraType?: string;
    multiplier?: number;
    message?: string;
  };
};

export default function ReplayScreen() {
  const colors = useColors();
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { userId } = useAuth();

  const game = useQuery(api.games.getGame, gameId ? { gameId } : "skip");
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const myUserId = user?._id;

  const replaySteps = useMemo(() => {
    if (!game || !game.history) return [];

    const cardPlayActions = game.history.filter(
      (entry: GameHistoryEntry) => entry.action === "card_played"
    );
    return cardPlayActions;
  }, [game]);

  const maxSteps = replaySteps.length;

  const currentGameState = useMemo(() => {
    if (!game) return null;

    const stepsToApply = replaySteps.slice(0, currentStep);
    const playedCards: any[] = [];

    stepsToApply.forEach((step: GameHistoryEntry) => {
      if (step.action === "card_played" && step.data) {
        playedCards.push({
          card: {
            id: step.data.cardId || "",
            suit: step.data.cardSuit || "hearts",
            rank: step.data.cardRank || "3",
            playable: false,
          },
          playerId: step.playerId,
          round: step.data.round || 1,
          timestamp: step.timestamp,
        });
      }
    });

    const currentRound = Math.floor(currentStep / 2) + 1;
    const currentPlayedInRound = playedCards.filter(
      (pc) => pc.round === currentRound
    );

    return {
      ...game,
      currentRound,
      playedCards: currentPlayedInRound,
      allPlayedCards: playedCards,
    };
  }, [game, replaySteps, currentStep]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentStep < maxSteps) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStep, maxSteps]);

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(maxSteps - 1, prev + 1));
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (currentStep >= maxSteps - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    gameArea: {
      flex: 1,
      padding: 16,
    },
    opponentSection: {
      marginBottom: 20,
    },
    battleSection: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 20,
    },
    playerSection: {
      marginTop: 20,
    },
    controlsBar: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 16,
    },
    controlsContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    controlButton: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.secondary,
    },
    playButton: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    stepInfo: {
      alignItems: "center",
    },
    stepText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "600",
    },
    roundText: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    text: {
      color: colors.text,
    },
  });

  if (!game || !currentGameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const myPlayer = game.players.find((p: any) => p.userId === myUserId);
  const opponent = game.players.find((p: any) => p.userId !== myUserId);

  const myHand: Card[] = myPlayer?.hand || [];
  const opponentHandSize = opponent?.hand?.length || 5;

  const currentRoundPlays = currentGameState.playedCards || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Replay de la partie</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.opponentSection}>
          <OpponentZone
            name={opponent?.username || "Adversaire"}
            cardsRemaining={opponentHandSize}
            hasHand={false}
          />
        </View>

        <View style={styles.battleSection}>
          <TurnPips
            currentRound={currentGameState.currentRound}
            totalRounds={game.maxRounds}
            roundsWonByPlayer={0}
            roundsWonByOpponent={0}
          />
          <BattleZone
            playerCards={
              (
                currentRoundPlays.find((pc: any) => pc.playerId === myUserId)
                  ?.card
              ) ?
                [
                  currentRoundPlays.find((pc: any) => pc.playerId === myUserId)
                    .card,
                ]
              : []
            }
            opponentCards={
              (
                currentRoundPlays.find((pc: any) => pc.playerId !== myUserId)
                  ?.card
              ) ?
                [
                  currentRoundPlays.find((pc: any) => pc.playerId !== myUserId)
                    .card,
                ]
              : []
            }
            battleLayout="vertical"
          />
        </View>

        <View style={styles.playerSection}>
          <CardHand
            cards={myHand}
            onCardSelect={() => {}}
            onCardDoubleTap={() => {}}
            selectedCard={null}
            isMyTurn={false}
            disabled={true}
          />
        </View>
      </View>

      <View style={styles.controlsBar}>
        <View style={styles.controlsContent}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePrevious}
            disabled={currentStep === 0}
          >
            <IconSymbol
              name="chevron.left.forwardslash.chevron.right"
              size={20}
              color={
                currentStep === 0 ?
                  colors.mutedForeground
                : colors.secondaryForeground
              }
            />
          </TouchableOpacity>

          <View style={styles.stepInfo}>
            <Text style={styles.stepText}>
              {currentStep} / {maxSteps}
            </Text>
            <Text style={styles.roundText}>
              Tour {currentGameState.currentRound} / {game.maxRounds}
            </Text>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <IconSymbol
              name={isPlaying ? "paperplane.fill" : "paperplane.fill"}
              size={24}
              color={colors.primaryForeground}
            />
          </TouchableOpacity>

          <View style={styles.stepInfo}>
            <Text style={styles.stepText}>
              {currentStep} / {maxSteps}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleNext}
            disabled={currentStep >= maxSteps - 1}
          >
            <IconSymbol
              name="chevron.right"
              size={20}
              color={
                currentStep >= maxSteps - 1 ?
                  colors.mutedForeground
                : colors.secondaryForeground
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
