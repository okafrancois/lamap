import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoomScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;
  const { setMatchReady } = useMatchmaking();
  const startGame = useMutation(api.games.startGame);

  const game = useQuery(
    api.games.getGame,
    roomId ? { gameId: roomId } : "skip"
  );

  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (game?.status === "PLAYING") {
      router.replace(`/(game)/match/${roomId}`);
    }
  }, [game?.status, roomId, router]);

  const handleReady = async () => {
    if (!game) return;
    setLoading(true);
    try {
      await setMatchReady(game.gameId);
      setIsReady(true);

      if (game.status === "WAITING" && game.players.length >= 2) {
        await startGame({ gameId: game.gameId });
      }
    } catch (error) {
      console.error("Error setting ready:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!game) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
        <Text style={styles.loadingText}>Chargement de la salle...</Text>
      </SafeAreaView>
    );
  }

  const me = game.players.find((p) => p.userId === myUserId);
  const opponent = game.players.find((p) => p.userId !== myUserId);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Salle d&apos;attente</Text>
        <Text style={styles.subtitle}>
          Mise: {game.bet.amount} {game.bet.currency}
        </Text>

        <View style={styles.players}>
          <View style={styles.playerCard}>
            <Avatar name={me?.username || "Vous"} size={60} />
            <Text style={styles.playerName}>{me?.username || "Vous"}</Text>
            {isReady && <Badge label="Prêt" variant="success" />}
          </View>

          <Text style={styles.vs}>VS</Text>

          <View style={styles.playerCard}>
            {opponent ?
              <>
                <Avatar name={opponent.username} size={60} />
                <Text style={styles.playerName}>{opponent.username}</Text>
              </>
            : <>
                <ActivityIndicator size="small" color={Colors.primary.gold} />
                <Text style={styles.waitingText}>En attente...</Text>
              </>
            }
          </View>
        </View>

        {!isReady && (
          <View style={styles.readySection}>
            <Button
              title="Je suis prêt"
              onPress={handleReady}
              loading={loading}
              style={styles.readyButton}
            />
          </View>
        )}

        {isReady && (
          <View style={styles.readySection}>
            <Text style={styles.waitingText}>
              En attente de l&apos;adversaire...
            </Text>
          </View>
        )}

        <Button
          title="Quitter"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.leaveButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: Colors.derived.white,
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.derived.white,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.primary.gold,
    textAlign: "center",
    marginBottom: 48,
    fontWeight: "600",
  },
  players: {
    alignItems: "center",
    marginBottom: 48,
  },
  playerCard: {
    alignItems: "center",
    backgroundColor: Colors.primary.blue,
    borderRadius: 16,
    padding: 24,
    minWidth: 200,
    marginVertical: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.derived.white,
    marginTop: 12,
  },
  vs: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary.gold,
    marginVertical: 16,
  },
  waitingText: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    marginTop: 12,
    textAlign: "center",
  },
  readySection: {
    alignItems: "center",
    marginBottom: 24,
  },
  readyButton: {
    minWidth: 200,
    minHeight: 56,
  },
  leaveButton: {
    marginTop: 16,
  },
});
