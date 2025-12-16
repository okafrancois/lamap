import { CardHand, type Card } from "@/components/game/CardHand";
import { GameChatDrawer } from "@/components/game/GameChatDrawer";
import { ResultModal } from "@/components/game/ResultModal";
import { TurnHistory } from "@/components/game/TurnHistory";
import { Badge } from "@/components/ui/Badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { api } from "@/convex/_generated/api";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/hooks/useGame";
import { useSound } from "@/hooks/useSound";
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
  const [chatVisible, setChatVisible] = useState(false);
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
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 2,
      borderBottomColor: colors.secondary,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    turnIndicator: {
      alignItems: "center",
    },
    turnText: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    betInfo: {
      alignItems: "center",
    },
    chatButton: {
      padding: 8,
    },
    betText: {
      fontSize: 16,
      color: colors.secondary,
      fontWeight: "600",
    },
    playArea: {
      flex: 1,
      padding: 16,
    },
    centerArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    leadSuitContainer: {
      marginBottom: 8,
    },
    turnHistory: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      minWidth: 200,
    },
    historyTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    historyItem: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    handArea: {
      padding: 16,
      backgroundColor: colors.card,
      borderTopWidth: 2,
      borderTopColor: colors.secondary,
    },
    yourTurnText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 8,
    },
    waitingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    playButtonContainer: {
      marginTop: 16,
      alignItems: "center",
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

  const hasHandPlayer = game.players.find((p) => {
    const playerId = p.userId || p.botId;
    return playerId === game.hasHandPlayerId;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            Tour {game.currentRound} / {game.maxRounds}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {game.bet.amount > 0 && (
            <View style={styles.betInfo}>
              <Text style={styles.betText}>
                Mise: {game.bet.amount} {game.bet.currency}
              </Text>
            </View>
          )}
          {game.mode === "ONLINE" && (
            <TouchableOpacity
              onPress={() => setChatVisible(true)}
              style={styles.chatButton}
            >
              <IconSymbol
                name="message.fill"
                size={24}
                color={colors.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.playArea}>
        <View style={styles.centerArea}>
          {hasHandPlayer && (
            <View style={styles.leadSuitContainer}>
              <Badge
                label={`${hasHandPlayer.username} a la main`}
                variant="default"
              />
            </View>
          )}
          <TurnHistory
            results={turnResults}
            myPlayerId={myUserId}
            game={game}
            currentPlays={currentPlays}
            currentRound={game.currentRound}
          />
        </View>
      </View>

      <View style={styles.handArea}>
        {isMyTurn && (
          <View style={styles.turnIndicator}>
            <Text style={styles.yourTurnText}>C&apos;est votre tour !</Text>
          </View>
        )}
        {!isMyTurn && (
          <View style={styles.turnIndicator}>
            <Text style={styles.waitingText}>
              En attente de l&apos;adversaire...
            </Text>
          </View>
        )}
        <CardHand
          cards={myHand}
          isMyTurn={isMyTurn}
          onCardSelect={handleCardSelect}
          onCardDoubleTap={handleDoubleTapCard}
          selectedCard={selectedCard}
          disabled={isPlaying}
        />
      </View>

      <GameChatDrawer
        gameId={matchId}
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
      />

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
