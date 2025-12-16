import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const conversations = useQuery(
    (api as any).messaging.getConversations,
    myUserId ? { userId: myUserId } : "skip"
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    conversationsList: {
      padding: 16,
    },
    conversationItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    conversationContent: {
      flex: 1,
      marginLeft: 12,
    },
    conversationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    conversationName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    conversationTime: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    conversationPreview: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    badge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 8,
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primaryForeground,
    },
  });

  if (!myUserId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </SafeAreaView>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Hier";
    } else if (days < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {conversations === undefined ?
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        : conversations.length === 0 ?
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune conversation</Text>
            <Text style={styles.emptySubtext}>
              Commencez une conversation avec un autre joueur
            </Text>
          </View>
        : <View style={styles.conversationsList}>
            {conversations.map((conv: any) => (
              <TouchableOpacity
                key={conv._id}
                style={styles.conversationItem}
                onPress={() => router.push(`/(messages)/${conv._id as string}`)}
              >
                <Avatar
                  name={conv.otherParticipant?.username || "Utilisateur"}
                  size={50}
                />
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>
                      {conv.otherParticipant?.username || "Utilisateur"}
                    </Text>
                    {conv.lastMessage && (
                      <Text style={styles.conversationTime}>
                        {formatTime(conv.lastMessage.timestamp)}
                      </Text>
                    )}
                  </View>
                  {conv.lastMessage && (
                    <Text style={styles.conversationPreview} numberOfLines={1}>
                      {conv.lastMessage.senderId === myUserId ? "Vous: " : ""}
                      {conv.lastMessage.content}
                    </Text>
                  )}
                </View>
                {conv.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{conv.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        }
      </ScrollView>
    </SafeAreaView>
  );
}
