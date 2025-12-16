import { CardHand, type Card } from "@/components/game/CardHand";
import { PlayingCard } from "@/components/game/PlayingCard";
import { TurnHistory } from "@/components/game/TurnHistory";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/hooks/useGame";
import { useSound } from "@/hooks/useSound";
import { useMutation } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchScreen() {
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

  useEffect(() => {
    if (game?.status === "ENDED") {
      router.replace(`/(game)/result/${matchId}`);
    }
  }, [game?.status, matchId, router]);

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

  const handleCardSelect = useCallback(
    (card: Card) => {
      if (canPlayCard(card)) {
        setSelectedCard(card);
        playSound("cardSelect");
      }
    },
    [canPlayCard, playSound]
  );

  const handlePlayCard = useCallback(async () => {
    if (!selectedCard) return;

    setIsPlaying(true);
    playSound("cardPlay");
    try {
      await playCard(selectedCard);
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
  }, [selectedCard, playCard, playSound]);

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
        <ActivityIndicator size="large" color={Colors.primary.gold} />
        <Text style={styles.loadingText}>Chargement de la partie...</Text>
      </SafeAreaView>
    );
  }

  if (game.status === "WAITING") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Préparation de la partie...</Text>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </SafeAreaView>
    );
  }

  if (game.status === "ENDED") {
    return null;
  }

  const opponent = game.players.find((p) => p.userId !== myUserId);
  const currentRoundCards = currentPlays || [];
  const myCard = currentRoundCards.find((pc) => pc.playerId === myUserId)?.card;
  const opponentCard = currentRoundCards.find(
    (pc) => pc.playerId !== myUserId
  )?.card;

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
        <View style={styles.betInfo}>
          <Text style={styles.betText}>
            Mise: {game.bet.amount} {game.bet.currency}
          </Text>
        </View>
      </View>

      <View style={styles.playArea}>
        <View style={styles.opponentArea}>
          <Text style={styles.playerLabel}>
            {opponent?.username || "Adversaire"}
          </Text>
          {opponentCard && (
            <View style={styles.playedCard}>
              <PlayingCard
                suit={opponentCard.suit}
                rank={opponentCard.rank}
                state="played"
                size="small"
              />
            </View>
          )}
        </View>

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
          />
        </View>

        <View style={styles.myArea}>
          {myCard && (
            <View style={styles.playedCard}>
              <PlayingCard
                suit={myCard.suit}
                rank={myCard.rank}
                state="played"
                size="small"
              />
            </View>
          )}
          <Text style={styles.playerLabel}>Vous</Text>
        </View>
      </View>

      <View style={styles.handArea}>
        {isMyTurn && !myCard && (
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
          isMyTurn={isMyTurn && !myCard}
          onCardSelect={handleCardSelect}
          onCardDoubleTap={handleDoubleTapCard}
          selectedCard={selectedCard}
          disabled={isPlaying || !!myCard}
        />

        {selectedCard && isMyTurn && !myCard && (
          <View style={styles.playButtonContainer}>
            <Button
              title="Jouer cette carte"
              onPress={handlePlayCard}
              loading={isPlaying}
              accessibilityLabel="Jouer la carte sélectionnée"
              accessibilityHint="Joue la carte que vous avez sélectionnée"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  loadingText: {
    color: Colors.derived.white,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.primary.blue,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.gold,
  },
  turnIndicator: {
    alignItems: "center",
    marginBottom: 8,
  },
  turnText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.derived.white,
    marginBottom: 8,
  },
  betInfo: {
    alignItems: "center",
  },
  betText: {
    fontSize: 16,
    color: Colors.primary.gold,
    fontWeight: "600",
  },
  playArea: {
    flex: 1,
    padding: 16,
  },
  opponentArea: {
    alignItems: "center",
    marginBottom: 24,
  },
  centerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  leadSuitContainer: {
    marginBottom: 8,
  },
  myArea: {
    alignItems: "center",
    marginTop: 24,
  },
  playerLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.derived.white,
    marginBottom: 8,
  },
  playedCard: {
    marginVertical: 8,
  },
  turnHistory: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.derived.white,
    marginBottom: 8,
  },
  historyItem: {
    fontSize: 12,
    color: Colors.derived.blueLight,
    marginBottom: 4,
  },
  handArea: {
    padding: 16,
    backgroundColor: Colors.primary.blue,
    borderTopWidth: 2,
    borderTopColor: Colors.primary.gold,
  },
  yourTurnText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary.gold,
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    marginBottom: 8,
  },
  playButtonContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.derived.white,
    marginBottom: 16,
  },
});
