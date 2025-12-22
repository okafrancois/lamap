import { BattleZone } from "@/components/game/BattleZone";
import { CardHand, type Card } from "@/components/game/CardHand";
import { ConcedeButton } from "@/components/game/ConcedeButton";
import { GameTimer } from "@/components/game/GameTimer";
import { OpponentZone } from "@/components/game/OpponentZone";
import { PlaceholderCardHand } from "@/components/game/PlaceholderCardHand";
import { ResultAnimation } from "@/components/game/ResultAnimation";
import { ResultPanel } from "@/components/game/ResultPanel";
import { TurnBadge } from "@/components/game/TurnBadge";
import { TurnHistory } from "@/components/game/TurnHistory";
import { TurnPips } from "@/components/game/TurnPips";
import { GameTutorial } from "@/components/tutorial/GameTutorial";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { Rank, Suit } from "@/convex/validators";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/hooks/useGame";
import { useGameTimer } from "@/hooks/useGameTimer";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useSettings } from "@/hooks/useSettings";
import { useSound } from "@/hooks/useSound";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import {
  useLocalSearchParams,
  useRouter,
  type ErrorBoundaryProps,
} from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colors = useColors();
  const router = useRouter();

  const errorStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      color: colors.text,
    },
    message: {
      fontSize: 16,
      textAlign: "center",
      lineHeight: 22,
      maxWidth: 300,
      color: colors.mutedForeground,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    button: {
      minWidth: 120,
    },
  });

  return (
    <SafeAreaView style={errorStyles.container}>
      <View style={errorStyles.content}>
        <Ionicons name="alert-circle" size={64} color={colors.destructive} />
        <Text style={errorStyles.title}>Erreur de chargement</Text>
        <Text style={errorStyles.message}>{error.message}</Text>
        <View style={errorStyles.actions}>
          <Button
            title="Réessayer"
            onPress={retry}
            variant="primary"
            style={errorStyles.button}
          />
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="outline"
            style={errorStyles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function MatchScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ matchId: string; tutorial?: string }>();
  const { matchId } = params;
  const isTutorial = params.tutorial === "true";
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

  const { userId } = useAuth();
  const concedeGameMutation = useMutation(api.games.concedeGame);
  const { playSound } = useSound();
  const startGame = useMutation(api.games.startGame);
  const { createMatchVsAI } = useMatchmaking();
  const sendRevengeRequest = useMutation(api.games.sendRevengeRequest);
  const acceptRevengeRequest = useMutation(api.games.acceptRevengeRequest);
  const rejectChallenge = useMutation(api.challenges.rejectChallenge);

  const gameMessages = useQuery(
    api.chat.getGameMessages,
    matchId ? { gameId: matchId } : "skip"
  );
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number | null>(
    null
  );
  const [unreadCount, setUnreadCount] = useState(0);

  const revengeStatus = useQuery(
    api.games.getRevengeRequestStatus,
    game?.status === "ENDED" && matchId && myUserId ?
      { gameId: matchId, userId: myUserId }
    : "skip"
  );

  const prChange = useQuery(
    api.ranking.getPRChangeForGame,
    (
      game?.status === "ENDED" &&
        matchId &&
        myUserId &&
        (game.mode === "RANKED" || game.competitive)
    ) ?
      { gameId: matchId, userId: myUserId }
    : "skip"
  );

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previousTurnResults, setPreviousTurnResults] = useState<any[]>([]);
  const [previousIsMyTurn, setPreviousIsMyTurn] = useState<boolean | undefined>(
    undefined
  );
  const [previousGameStatus, setPreviousGameStatus] = useState<
    string | undefined
  >(undefined);
  const [resultPanelVisible, setResultPanelVisible] = useState(false);
  const hasStartedGameRef = useRef(false);
  const currentGameIdRef = useRef<string | null>(null);

  const {
    enabled: isTimerActive,
    timeRemaining,
    totalTime,
    timers: allTimers,
  } = useGameTimer(game?.gameId, myUserId || null);

  // Redirect to new game when revenge is accepted
  useEffect(() => {
    if (
      revengeStatus?.status === "accepted" &&
      "newGameId" in revengeStatus &&
      revengeStatus.newGameId
    ) {
      setResultPanelVisible(false);
      router.replace(`/(game)/match/${revengeStatus.newGameId}`);
    }
  }, [revengeStatus, router]);

  useEffect(() => {
    if (game?.gameId && game.gameId !== currentGameIdRef.current) {
      currentGameIdRef.current = game.gameId;
      hasStartedGameRef.current = false;
    }
  }, [game?.gameId]);

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
    if (previousGameStatus !== "PLAYING" && game?.status === "PLAYING") {
      playSound("gameStart");
    }
    setPreviousGameStatus(game?.status);
  }, [game?.status, previousGameStatus, playSound]);

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
      setResultPanelVisible(true);
    }
  }, [game?.status]);

  useEffect(() => {
    const loadLastSeenTimestamp = async () => {
      if (!matchId) return;
      try {
        const key = `gameChatLastSeen_${matchId}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          setLastSeenTimestamp(parseInt(stored, 10));
        } else {
          setLastSeenTimestamp(Date.now());
        }
      } catch (error) {
        console.error("Error loading last seen timestamp:", error);
      }
    };
    loadLastSeenTimestamp();
  }, [matchId]);

  useEffect(() => {
    if (!gameMessages || !myUserId || lastSeenTimestamp === null) {
      setUnreadCount(0);
      return;
    }

    const unread = gameMessages.filter(
      (msg: any) =>
        msg.timestamp > lastSeenTimestamp && msg.playerId !== myUserId
    ).length;
    setUnreadCount(unread);
  }, [gameMessages, myUserId, lastSeenTimestamp]);

  const handleChatPress = useCallback(async () => {
    if (!matchId) return;
    try {
      const key = `gameChatLastSeen_${matchId}`;
      const now = Date.now();
      await AsyncStorage.setItem(key, now.toString());
      setLastSeenTimestamp(now);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error saving last seen timestamp:", error);
    }
    router.push(`/(game)/chat/${matchId}`);
  }, [matchId, router]);

  useEffect(() => {
    if (
      game?.status === "WAITING" &&
      game.players.length >= 2 &&
      !hasStartedGameRef.current
    ) {
      hasStartedGameRef.current = true;

      const startGameAsync = async () => {
        try {
          await startGame({ gameId: game.gameId });
        } catch (error: any) {
          if (!error?.message?.includes("Game already started")) {
            console.error("Error starting game:", error);
            hasStartedGameRef.current = false;
          }
        }
      };

      const delay = game.mode === "ONLINE" ? 1000 : 0;
      setTimeout(startGameAsync, delay);
    }
  }, [game?.status, game?.players.length, game?.gameId, game?.mode, startGame]);

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

  const handleConcede = useCallback(async () => {
    if (!userId || !matchId) return;

    try {
      await concedeGameMutation({
        gameId: matchId,
        clerkUserId: userId,
      });

      Alert.alert(
        "Partie abandonnée",
        "Vous avez abandonné la partie. Votre adversaire a gagné.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error ?
          error.message
        : "Impossible d'abandonner la partie",
        [{ text: "OK" }]
      );
    }
  }, [userId, matchId, concedeGameMutation, router]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
      borderWidth: 1,
      padding: 4,
      paddingHorizontal: 8,
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
      gap: 14,
    },
    chatButton: {
      padding: 4,
      position: "relative",
    },
    chatBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.destructive,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: colors.background,
    },
    chatBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.destructiveForeground,
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
      paddingTop: 20,
      height: 200,
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
      position: "absolute",
      bottom: 170,
      minWidth: 150,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 100,
    },
  });

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
          <View style={styles.quitButtonContainer}>
            <Button
              title="Quitter"
              onPress={() => router.back()}
              variant="outline"
              size="sm"
            />
          </View>
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
          <BattleZone
            opponentCards={[]}
            playerCards={[]}
            battleLayout={battleLayout}
          />

          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingLabel}>Préparation de la partie...</Text>
          </View>
        </View>

        <View style={styles.handArea}>
          <PlaceholderCardHand cardCount={5} />
          <View style={styles.quitButtonContainer}>
            <Button
              title="Quitter"
              onPress={() => router.back()}
              variant="outline"
              size="sm"
            />
          </View>
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

  const opponentId = opponent?.userId || opponent?.botId;
  const opponentTimer =
    opponentId ? allTimers.find((t) => t.playerId === opponentId) : null;
  const opponentTimeRemaining = opponentTimer?.timeRemaining || 0;
  const isOpponentTurn = opponentId === game?.currentTurnPlayerId;

  const roundsWonByPlayer =
    turnResults?.filter((r) => r.winnerId === myUserId).length || 0;
  const roundsWonByOpponent = (turnResults?.length || 0) - roundsWonByPlayer;

  const opponentPlayedCard = currentPlays?.find(
    (pc) => pc.playerId !== myUserId
  )?.card;
  const playerPlayedCard = currentPlays?.find(
    (pc) => pc.playerId === myUserId
  )?.card;

  const firstPlayedCard =
    currentPlays && currentPlays.length > 0 ?
      currentPlays.reduce((earliest, current) =>
        current.timestamp < earliest.timestamp ? current : earliest
      )
    : null;

  const leadSuit = firstPlayedCard?.card?.suit;

  const includeCurrentPlays = game.status !== "ENDED";

  const allOpponentCards = [
    ...(turnResults
      ?.map(
        (result) =>
          game.playedCards
            ?.filter((pc: any) => pc.round === result.turn)
            .find((pc: any) => pc.playerId !== myUserId)?.card
      )
      .filter(Boolean) || []),
    ...(includeCurrentPlays && opponentPlayedCard ? [opponentPlayedCard] : []),
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
    ...(includeCurrentPlays && playerPlayedCard ? [playerPlayedCard] : []),
  ].filter(Boolean);

  const gameScreen = (
    <BackgroundGradient>
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
              {isTimerActive && game.status === "PLAYING" && (
                <GameTimer
                  timeRemaining={timeRemaining}
                  totalTime={totalTime}
                  isMyTurn={isMyTurn}
                  isActive={true}
                  isOpponentTimer={false}
                />
              )}
              {game.status === "PLAYING" && (
                <ConcedeButton onConcede={handleConcede} disabled={isPlaying} />
              )}
              {game.mode !== "AI" && (
                <TouchableOpacity
                  onPress={handleChatPress}
                  style={styles.chatButton}
                >
                  <Ionicons
                    name="chatbubble"
                    size={24}
                    color={colors.secondary}
                  />
                  {unreadCount > 0 && (
                    <View style={styles.chatBadge}>
                      <Text style={styles.chatBadgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
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
            timerRemaining={
              isTimerActive && game.status === "PLAYING" ?
                opponentTimeRemaining
              : undefined
            }
            totalTime={totalTime}
            isOpponentTurn={isOpponentTurn}
          />
        )}

        <View style={styles.playArea}>
          {playAreaMode === "battle" ?
            <BattleZone
              opponentCards={allOpponentCards.map((card: any) => ({
                suit: card?.suit as Suit,
                rank: card?.rank as Rank,
              }))}
              playerCards={allPlayerCards.map((card: any) => ({
                suit: card?.suit as Suit,
                rank: card?.rank as Rank,
              }))}
              leadSuit={leadSuit}
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

        {game.status === "ENDED" && game.victoryType && (
          <>
            <ResultAnimation
              visible={resultPanelVisible}
              victoryType={game.victoryType}
              isWinner={game.winnerId === myUserId}
            />
            <ResultPanel
              visible={resultPanelVisible}
              game={game}
              myUserId={myUserId ?? null}
              prChange={prChange?.change ?? null}
              onRevenge={async () => {
                if (!myUserId || !matchId) return;

                const isAIMatch = game.aiDifficulty !== null;
                const isRankedMatch = game.mode === "RANKED";
                const isCashMatch = game.mode === "CASH";

                if (isAIMatch) {
                  try {
                    const difficulty = game.aiDifficulty as
                      | "easy"
                      | "medium"
                      | "hard";
                    const newGameId = await createMatchVsAI(
                      game.bet.amount,
                      difficulty,
                      game.bet.currency as "EUR" | "XAF"
                    );
                    setResultPanelVisible(false);
                    router.replace(`/(game)/match/${newGameId}`);
                  } catch (error) {
                    Alert.alert(
                      "Erreur",
                      error instanceof Error ?
                        error.message
                      : "Impossible de créer la revanche"
                    );
                  }
                } else if (isRankedMatch || isCashMatch) {
                  try {
                    await sendRevengeRequest({
                      originalGameId: matchId,
                      senderId: myUserId,
                    });
                  } catch (error) {
                    console.error("Erreur sendRevengeRequest:", error);
                    Alert.alert(
                      "Erreur",
                      error instanceof Error ?
                        error.message
                      : "Impossible d'envoyer la proposition de revanche"
                    );
                  }
                }
              }}
              onNewGame={() => {
                setResultPanelVisible(false);

                const isAIMatch = game.aiDifficulty !== null;
                const isRankedMatch = game.mode === "RANKED";
                const isCashMatch = game.mode === "CASH";

                if (isAIMatch) {
                  router.push(
                    `/(lobby)/select-difficulty?betAmount=${game.bet.amount}`
                  );
                } else if (isRankedMatch) {
                  router.replace("/(lobby)/ranked-matchmaking");
                } else if (isCashMatch) {
                  router.replace(
                    `/(lobby)/matchmaking?betAmount=${game.bet.amount}&competitive=${game.competitive ?? true}`
                  );
                } else {
                  router.replace("/(lobby)/select-mode");
                }
              }}
              onGoHome={() => {
                setResultPanelVisible(false);
                router.replace("/(tabs)");
              }}
              revengeStatus={
                revengeStatus?.status === "sent" ? "sent"
                : revengeStatus?.status === "accepted" ?
                  "sent"
                : revengeStatus?.status === "received" ?
                  "received"
                : "none"
              }
              onAcceptRevenge={async () => {
                if (!myUserId || !revengeStatus?.challengeId) return;

                try {
                  const result = await acceptRevengeRequest({
                    challengeId: revengeStatus.challengeId,
                    userId: myUserId,
                  });
                  setResultPanelVisible(false);
                  router.replace(`/(game)/match/${result.gameId}`);
                } catch (error) {
                  Alert.alert(
                    "Erreur",
                    error instanceof Error ?
                      error.message
                    : "Impossible d'accepter la revanche"
                  );
                }
              }}
              onRejectRevenge={async () => {
                if (!revengeStatus?.challengeId || !myUserId) return;

                try {
                  await rejectChallenge({
                    challengeId: revengeStatus.challengeId,
                    userId: myUserId,
                  });
                } catch (error) {
                  console.error("Error rejecting revenge:", error);
                }
              }}
            />
          </>
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );

  if (isTutorial) {
    return (
      <GameTutorial
        gameState={game}
        currentRound={game?.currentRound || 1}
        isMyTurn={isMyTurn || false}
        onTutorialComplete={() => {
          router.push("/(onboarding)/tutorial");
        }}
      >
        {gameScreen}
      </GameTutorial>
    );
  }

  return gameScreen;
}
