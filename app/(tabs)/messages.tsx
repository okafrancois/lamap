import { Avatar } from "@/components/ui/Avatar";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
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

  if (!myUserId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
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
            <ActivityIndicator size="large" color={Colors.primary.gold} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.blue,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.derived.white,
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
    color: Colors.derived.white,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.derived.blueLight,
    textAlign: "center",
  },
  conversationsList: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.blue,
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
    color: Colors.derived.white,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.derived.blueLight,
  },
  conversationPreview: {
    fontSize: 14,
    color: Colors.derived.blueLight,
  },
  badge: {
    backgroundColor: Colors.primary.red,
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
    color: Colors.derived.white,
  },
});
