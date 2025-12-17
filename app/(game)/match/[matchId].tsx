import { BattleZone } from "@/components/game/BattleZone";
import { CardHand, type Card } from "@/components/game/CardHand";
import { OpponentZone } from "@/components/game/OpponentZone";
import { PlaceholderCardHand } from "@/components/game/PlaceholderCardHand";
import { ResultModal } from "@/components/game/ResultModal";
import { TurnBadge } from "@/components/game/TurnBadge";
import { TurnHistory } from "@/components/game/TurnHistory";
import { TurnPips } from "@/components/game/TurnPips";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/hooks/useGame";
import { useSettings } from "@/hooks/useSettings";
import { useSound } from "@/hooks/useSound";
import { Ionicons } from "@expo/vector-icons";
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
  const { playAreaMode, battleLayout } = useSettings();

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
      paddingVertical: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
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
      fontSize: 12,
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
    playArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    handArea: {
      backgroundColor: colors.card,
      borderTopWidth: 2,
      borderTopColor: colors.border,
      paddingTop: 16,
      position: "relative",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
    },
    turnBadgeContainer: {
      alignItems: "center",
      paddingVertical: 8,
      position: "absolute",
      width: "100%",
      top: -80,
      zIndex: 0,
    },
    confirmButtonContainer: {
      position: "absolute",
      bottom: 180,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 100,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
    },
    loadingOverlay: {
      alignItems: "center",
      gap: 12,
    },
    loadingLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    quitButtonContainer: {
      padding: 16,
      paddingBottom: 24,
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
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft} />
          </View>
        </View>

        <OpponentZone name="?" hasHand={false} cardsRemaining={5} />

        <View style={styles.playArea}>
          <BattleZone
            opponentCards={[]}
            playerCards={[]}
            battleLayout={battleLayout}
          />
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingLabel}>Chargement de la partie...</Text>
          </View>
        </View>

        <View style={styles.handArea}>
          <PlaceholderCardHand cardCount={5} />
        </View>
      </SafeAreaView>
    );
  }

  if (game.status === "WAITING") {
    const opponent = game.players.find((p) => {
      const playerId = p.userId || p.botId;
      return playerId !== myUserId;
    });

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              {game.bet.amount > 0 && (
                <View style={styles.betBadge}>
                  <Ionicons
                    name="trophy"
                    size={12}
                    color={colors.secondaryForeground}
                  />
                  <Text style={styles.betText}>
                    {game.bet.amount} {game.bet.currency}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <OpponentZone
          name={opponent?.username || "?"}
          hasHand={false}
          cardsRemaining={5}
        />

        <View style={styles.playArea}>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingLabel}>Préparation de la partie...</Text>
          </View>
          <BattleZone
            opponentCards={[]}
            playerCards={[]}
            battleLayout={battleLayout}
          />
        </View>

        <View style={styles.handArea}>
          <PlaceholderCardHand cardCount={5} />
        </View>
      </SafeAreaView>
    );
  }

  const hasHandPlayer = game.players.find((p) => {
    const playerId = p.userId || p.botId;
    return playerId === game.hasHandPlayerId;
  });

  const opponent = game.players.find((p) => {
    const playerId = p.userId || p.botId;
    return playerId !== myUserId;
  });

  const opponentHasHand =
    hasHandPlayer && (hasHandPlayer.userId || hasHandPlayer.botId) !== myUserId;
  const iHaveHand =
    hasHandPlayer && (hasHandPlayer.userId || hasHandPlayer.botId) === myUserId;

  const opponentCardsRemaining = opponent?.hand?.length || 0;

  const roundsWonByPlayer =
    turnResults?.filter((r) => r.winnerId === myUserId).length || 0;
  const roundsWonByOpponent = (turnResults?.length || 0) - roundsWonByPlayer;

  const opponentPlayedCard = currentPlays?.find(
    (pc) => pc.playerId !== myUserId
  )?.card;
  const playerPlayedCard = currentPlays?.find(
    (pc) => pc.playerId === myUserId
  )?.card;

  const leadSuit =
    iHaveHand && opponentPlayedCard ? opponentPlayedCard.suit
    : opponentHasHand && playerPlayedCard ? playerPlayedCard.suit
    : undefined;

  const allOpponentCards = [
    ...(turnResults
      ?.map(
        (result) =>
          game.playedCards
            ?.filter((pc: any) => pc.round === result.turn)
            .find((pc: any) => pc.playerId !== myUserId)?.card
      )
      .filter(Boolean) || []),
    ...(opponentPlayedCard ? [opponentPlayedCard] : []),
  ].filter(Boolean);

  const allPlayerCards = [
    ...(turnResults
      ?.map(
        (result) =>
          game.playedCards
            ?.filter((pc: any) => pc.round === result.turn)
            .find((pc: any) => pc.playerId === myUserId)?.card
      )
      .filter(Boolean) || []),
    ...(playerPlayedCard ? [playerPlayedCard] : []),
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TurnPips
              totalRounds={game.maxRounds}
              currentRound={game.currentRound}
              roundsWonByPlayer={roundsWonByPlayer}
              roundsWonByOpponent={roundsWonByOpponent}
            />
            {game.bet.amount > 0 && (
              <View style={styles.betBadge}>
                <Ionicons
                  name="trophy"
                  size={12}
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
      </View>

      {opponent && (
        <OpponentZone
          name={opponent.username}
          hasHand={opponentHasHand}
          cardsRemaining={opponentCardsRemaining}
        />
      )}

      <View style={styles.playArea}>
        {playAreaMode === "battle" ?
          <BattleZone
            opponentCards={allOpponentCards.map((card: any) => ({
              suit: card?.suit as "hearts" | "diamonds" | "clubs" | "spades",
              rank: card?.rank as
                | "3"
                | "4"
                | "5"
                | "6"
                | "7"
                | "8"
                | "9"
                | "10",
            }))}
            playerCards={allPlayerCards.map((card: any) => ({
              suit: card?.suit as "hearts" | "diamonds" | "clubs" | "spades",
              rank: card?.rank as
                | "3"
                | "4"
                | "5"
                | "6"
                | "7"
                | "8"
                | "9"
                | "10",
            }))}
            leadSuit={
              leadSuit as "hearts" | "diamonds" | "clubs" | "spades" | undefined
            }
            battleLayout={battleLayout}
          />
        : <TurnHistory
            results={turnResults}
            myPlayerId={myUserId}
            game={game}
            currentPlays={currentPlays}
            currentRound={game.currentRound}
          />
        }
      </View>

      <View style={styles.handArea}>
        <View style={styles.turnBadgeContainer}>
          <TurnBadge visible={isMyTurn} hasHand={iHaveHand} />
        </View>
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
            router.replace("/(lobby)/select-mode");
          }}
          onGoHome={() => {
            setResultModalVisible(false);
            router.replace("/(lobby)/select-mode");
          }}
        />
      )}
    </SafeAreaView>
  );
}
