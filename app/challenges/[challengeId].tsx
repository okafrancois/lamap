import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengeDetailScreen() {
  const colors = useColors();
  const { userId } = useAuth();
  const router = useRouter();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();

  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );

  const challenge = useQuery(
    api.challenges.getChallenge,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip"
  );

  const acceptChallenge = useMutation(api.challenges.acceptChallenge);
  const rejectChallenge = useMutation(api.challenges.rejectChallenge);

  const handleAcceptChallenge = useCallback(async () => {
    if (!user?._id || !challengeId) return;

    try {
      const result = await acceptChallenge({
        challengeId: challengeId as Id<"challenges">,
        userId: user._id,
      });
      if (result?.gameId) {
        router.push(`/(game)/match/${result.gameId}`);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible d'accepter le défi");
    }
  }, [user?._id, challengeId, acceptChallenge, router]);

  const handleRejectChallenge = useCallback(async () => {
    if (!user?._id || !challengeId) return;

    try {
      await rejectChallenge({
        challengeId: challengeId as Id<"challenges">,
        userId: user._id,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de refuser le défi");
    }
  }, [user?._id, challengeId, rejectChallenge, router]);

  useEffect(() => {
    if (challenge?.status === "accepted" && challenge.gameId) {
      router.push(`/(game)/match/${challenge.gameId}`);
    }
  }, [challenge?.status, challenge?.gameId, router]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
    },
    vsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    playerContainer: {
      alignItems: "center",
      gap: 12,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.muted,
    },
    playerName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 8,
    },
    vsText: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.secondary,
      marginVertical: 16,
    },
    detailsSection: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontWeight: "500",
    },
    detailValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "600",
    },
    badge: {
      marginTop: 8,
    },
    statusBadge: {
      marginTop: 16,
      alignSelf: "center",
    },
    actions: {
      gap: 12,
      marginTop: 24,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    expiredText: {
      fontSize: 14,
      color: colors.destructive,
      textAlign: "center",
      marginTop: 8,
      fontStyle: "italic",
    },
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Défi</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.mutedForeground}
          />
          <Text style={styles.emptyText}>Défi non trouvé</Text>
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isChallenger = challenge.challenger?._id === user._id;
  const isChallenged = challenge.challenged?._id === user._id;
  const canRespond = isChallenged && challenge.status === "pending";
  const isExpired =
    challenge.status === "pending" && Date.now() > challenge.expiresAt;

  const opponent = isChallenger ? challenge.challenged : challenge.challenger;
  const currentUser =
    isChallenger ? challenge.challenger : challenge.challenged;

  const getStatusLabel = () => {
    if (isExpired) return "Expiré";
    if (challenge.status === "pending") return "En attente";
    if (challenge.status === "accepted") return "Accepté";
    if (challenge.status === "rejected") return "Refusé";
    return "Inconnu";
  };

  const getStatusVariant = (): "default" | "success" | "warning" | "kora" => {
    if (isExpired) return "warning";
    if (challenge.status === "accepted") return "success";
    if (challenge.status === "rejected") return "warning";
    return "default";
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View>
            <View style={styles.vsContainer}>
              <View style={styles.playerContainer}>
                <Avatar
                  name={currentUser?.username || "Vous"}
                  imageUrl={currentUser?.avatarUrl}
                  size={80}
                />
                <Text style={styles.playerName}>Vous</Text>
                {currentUser?.pr && (
                  <Badge label={`PR: ${currentUser.pr}`} variant="default" />
                )}
              </View>

              <Text style={styles.vsText}>VS</Text>

              <View style={styles.playerContainer}>
                <Avatar
                  name={opponent?.username || "Joueur"}
                  imageUrl={opponent?.avatarUrl}
                  size={80}
                />
                <Text style={styles.playerName}>
                  {opponent?.username || "Joueur"}
                </Text>
                {opponent?.pr && (
                  <Badge label={`PR: ${opponent.pr}`} variant="default" />
                )}
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mode</Text>
                <Badge
                  label={challenge.mode === "RANKED" ? "Classé" : "Cash"}
                  variant={challenge.mode === "RANKED" ? "default" : "warning"}
                />
              </View>

              {challenge.betAmount && challenge.betAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mise</Text>
                  <Text style={styles.detailValue}>
                    {challenge.betAmount} {challenge.currency || "XAF"}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Compétitif</Text>
                <Text style={styles.detailValue}>
                  {challenge.competitive ? "Oui" : "Non"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Créé le</Text>
                <Text style={styles.detailValue}>
                  {format(
                    new Date(challenge.createdAt),
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr }
                  )}
                </Text>
              </View>

              {challenge.expiresAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expire le</Text>
                  <Text style={styles.detailValue}>
                    {format(
                      new Date(challenge.expiresAt),
                      "dd MMMM yyyy à HH:mm",
                      { locale: fr }
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.statusBadge}>
                <Badge label={getStatusLabel()} variant={getStatusVariant()} />
              </View>

              {isExpired && (
                <Text style={styles.expiredText}>
                  Ce défi a expiré et ne peut plus être accepté.
                </Text>
              )}
            </View>

            {canRespond && !isExpired && (
              <View style={styles.actions}>
                <Button
                  title="Accepter le défi"
                  onPress={handleAcceptChallenge}
                  variant="primary"
                />
                <Button
                  title="Refuser"
                  onPress={handleRejectChallenge}
                  variant="secondary"
                />
              </View>
            )}

            {isChallenger && challenge.status === "pending" && (
              <View style={styles.actions}>
                <Text style={styles.detailLabel}>
                  En attente de la réponse de{" "}
                  {opponent?.username || "votre adversaire"}
                </Text>
              </View>
            )}

            {challenge.status === "rejected" && (
              <View style={styles.actions}>
                <Text style={styles.expiredText}>Ce défi a été refusé.</Text>
                <Button
                  title="Retour"
                  onPress={() => router.back()}
                  variant="secondary"
                  style={{ marginTop: 16 }}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
