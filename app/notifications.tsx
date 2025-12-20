import { IconSymbol } from "@/components/ui/icon-symbol";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );

  const notifications = useQuery(
    api.notifications.getNotificationsForUser,
    user?._id ? { userId: user._id } : "skip"
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
    notificationsList: {
      padding: 16,
    },
    notificationItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    notificationIcon: {
      marginRight: 12,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    notificationBody: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
    },
  });

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "challenge":
        return "gamecontroller.fill";
      case "message":
        return "message.fill";
      case "match_found":
        return "person.2.fill";
      case "turn":
        return "clock.fill";
      default:
        return "bell.fill";
    }
  };

  const handleNotificationPress = (notification: any) => {
    const data = notification.data || {};
    if (data.type === "challenge") {
      router.push("/(tabs)/profile");
    } else if (data.type === "message") {
      router.push("/(tabs)/messages");
    } else if (data.type === "match_found" || data.type === "turn") {
      if (data.gameId) {
        router.push(`/(game)/match/${data.gameId}`);
      }
    }
  };

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
      return format(date, "d MMM", { locale: fr });
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {notifications === undefined ?
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        : notifications.length === 0 ?
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="bell.fill"
              size={64}
              color={colors.mutedForeground}
            />
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubtext}>
              Vous serez notifié des nouveaux défis, messages et tours de jeu
            </Text>
          </View>
        : <View style={styles.notificationsList}>
            {notifications.map((notification: any) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationHeader}>
                  <IconSymbol
                    name={getNotificationIcon(notification.data?.type)}
                    size={24}
                    color={colors.primary}
                    style={styles.notificationIcon}
                  />
                  <Text style={styles.notificationTitle}>
                    {notification.title || "Notification"}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification._creationTime)}
                  </Text>
                </View>
                {notification.body && (
                  <Text style={styles.notificationBody}>
                    {notification.body}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        }
      </ScrollView>
    </SafeAreaView>
  );
}

