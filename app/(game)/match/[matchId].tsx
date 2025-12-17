import { CardHand, type Card } from "@/components/game/CardHand";
import { PlayerIndicator } from "@/components/game/PlayerIndicator";
import { ResultModal } from "@/components/game/ResultModal";
import { TurnHistory } from "@/components/game/TurnHistory";
import { api } from "@/convex/_generated/api";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/hooks/useGame";
import { useSound } from "@/hooks/useSound";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchScreen() {
  const colors = useColors();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();

  const {
    game,
    myHand,
    currentPlays,
    turnResults,
    isMyTurn,
    playCard,
    canPlayCard,
    myUserId,
  } = useGame(matchId || null);
  const startGame = useMutation(api.games.startGame);
  const { playSound } = useSound();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previousTurnResults, setPreviousTurnResults] = useState<any[]>([]);
  const [previousIsMyTurn, setPreviousIsMyTurn] = useState<boolean | undefined>(
    undefined
  );
  const [previousGameStatus, setPreviousGameStatus] = useState<
    string | undefined
  >(undefined);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  useEffect(() => {
    if (turnResults && turnResults.length > previousTurnResults.length) {
      const newResult = turnResults[turnResults.length - 1];
      if (newResult && newResult.winnerId === myUserId) {
        playSound("victory");
      }
    }
    setPreviousTurnResults(turnResults || []);
  }, [turnResults, myUserId, playSound, previousTurnResults.length]);

  useEffect(() => {
    if (
      game?.victoryType &&
      game.victoryType.includes("kora") &&
      game.winnerId === myUserId
    ) {
      playSound("kora");
    }
  }, [game?.victoryType, game?.winnerId, myUserId, playSound]);

  useEffect(() => {
    if (game?.status === "WAITING" && matchId) {
      startGame({ gameId: matchId }).catch((error) => {
        Alert.alert(
          "Erreur de démarrage",
          "Impossible de démarrer la partie. Veuillez réessayer."
        );
        console.error("Error starting game:", error);
      });
    }
  }, [game?.status, matchId, startGame]);

  // Son quand la partie démarre
  useEffect(() => {
    if (previousGameStatus !== "PLAYING" && game?.status === "PLAYING") {
      playSound("gameStart");
    }
    setPreviousGameStatus(game?.status);
  }, [game?.status, previousGameStatus, playSound]);

  // Son quand le tour change
  useEffect(() => {
    if (
      previousIsMyTurn !== undefined &&
      previousIsMyTurn !== isMyTurn &&
      game?.status === "PLAYING"
    ) {
      playSound("turnChange");
    }
    setPreviousIsMyTurn(isMyTurn);
  }, [isMyTurn, previousIsMyTurn, game?.status, playSound]);

  useEffect(() => {
    if (game?.status === "ENDED") {
      setResultModalVisible(true);
    }
  }, [game?.status]);

  const handleCardSelect = useCallback(
    (card: Card) => {
      if (canPlayCard(card)) {
        setSelectedCard(card);
        playSound("cardSelect");
      }
    },
    [canPlayCard, playSound]
  );

  const handleDoubleTapCard = useCallback(
    async (card: Card) => {
      if (isPlaying) return;

      setIsPlaying(true);
      playSound("cardPlay");
      // Optimistically select the card if not already selected to show feedback
      setSelectedCard(card);

      try {
        await playCard(card);
        setSelectedCard(null);
      } catch (error: any) {
        Alert.alert(
          "Carte non jouable",
          error.message ||
            "Cette carte ne peut pas être jouée pour le moment. Vérifiez que c'est votre tour et que vous suivez la couleur demandée."
        );
      } finally {
        setIsPlaying(false);
      }
    },
    [isPlaying, playCard, playSound]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.text,
      marginTop: 16,
      fontSize: 16,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    turnText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
    },
    betBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    betText: {
      fontSize: 13,
      color: colors.secondaryForeground,
      fontWeight: "600",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    chatButton: {
      padding: 6,
    },
    playersRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    playArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    handArea: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
    },
  });

  // Conditional rendering after all hooks are called
  if (!matchId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.loadingText}>Match ID manquant</Text>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Chargement de la partie...</Text>
      </SafeAreaView>
    );
  }

  if (game.status === "WAITING") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Préparation de la partie...</Text>
        <ActivityIndicator size="large" color={colors.secondary} />
      </SafeAreaView>
    );
  }

  const currentTurnPlayer = game.players.find((p) => {
    const playerId = p.userId || p.botId;
    return playerId === game.currentTurnPlayerId;
  });

  const hasHandPlayer = game.players.find((p) => {
    const playerId = p.userId || p.botId;
    return playerId === game.hasHandPlayerId;
  });

  const opponent = game.players.find((p) => {
    const playerId = p.userId || p.botId;
    return playerId !== myUserId;
  });

  const me = game.players.find((p) => {
    const playerId = p.userId || p.botId;
    return playerId === myUserId;
  });

  const isOpponentTurn =
    currentTurnPlayer &&
    (currentTurnPlayer.userId || currentTurnPlayer.botId) !== myUserId;
  const opponentHasHand =
    hasHandPlayer && (hasHandPlayer.userId || hasHandPlayer.botId) !== myUserId;
  const iHaveHand =
    hasHandPlayer && (hasHandPlayer.userId || hasHandPlayer.botId) === myUserId;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.turnText}>
              Tour {game.currentRound} / {game.maxRounds}
            </Text>
            {game.bet.amount > 0 && (
              <View style={styles.betBadge}>
                <Ionicons
                  name="trophy"
                  size={14}
                  color={colors.secondaryForeground}
                />
                <Text style={styles.betText}>
                  {game.bet.amount} {game.bet.currency}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {game.mode === "ONLINE" && (
              <TouchableOpacity
                onPress={() => router.push(`/(game)/chat/${matchId}`)}
                style={styles.chatButton}
              >
                <Ionicons
                  name="chatbubble"
                  size={20}
                  color={colors.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.playersRow}>
          {opponent && (
            <PlayerIndicator
              name={opponent.username}
              hasHand={opponentHasHand}
              isCurrentTurn={isOpponentTurn}
              position="top"
              leadSuit={
                opponentHasHand && currentPlays && currentPlays.length > 0 ?
                  currentPlays.find((pc) => pc.playerId !== myUserId)?.card
                    ?.suit
                : undefined
              }
            />
          )}
          {me && (
            <PlayerIndicator
              name={me.username}
              hasHand={iHaveHand}
              isCurrentTurn={isMyTurn}
              isMe
              position="bottom"
              leadSuit={
                iHaveHand && currentPlays && currentPlays.length > 0 ?
                  currentPlays.find((pc) => pc.playerId === myUserId)?.card
                    ?.suit
                : undefined
              }
            />
          )}
        </View>
      </View>

      <View style={styles.playArea}>
        <TurnHistory
          results={turnResults}
          myPlayerId={myUserId}
          game={game}
          currentPlays={currentPlays}
          currentRound={game.currentRound}
        />
      </View>

      <View style={styles.handArea}>
        <CardHand
          cards={myHand}
          isMyTurn={isMyTurn}
          onCardSelect={handleCardSelect}
          onCardDoubleTap={handleDoubleTapCard}
          selectedCard={selectedCard}
          disabled={isPlaying}
        />
      </View>

      {game.status === "ENDED" && (
        <ResultModal
          visible={resultModalVisible}
          game={game}
          myUserId={myUserId ?? null}
          onClose={() => {
            setResultModalVisible(false);
            router.replace("/(tabs)");
          }}
          onGoHome={() => {
            setResultModalVisible(false);
            router.replace("/(tabs)");
          }}
        />
      )}
    </SafeAreaView>
  );
}
