import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "./icon-symbol";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );

  const notifications = useQuery(
    api.notifications.getNotificationsForUser,
    user?._id ? { userId: user._id as any, limit: 50 } : "skip"
  );

  const unreadNotificationsCount =
    notifications?.filter(
      (n: any) =>
        n.state !== "delivered" &&
        n.state !== "failed" &&
        n.state !== "unable_to_deliver"
    ).length || 0;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: insets.top,
      paddingBottom: 6,
      backgroundColor: colors.background,
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
    },
    button: {
      padding: 8,
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    titleContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/notifications")}
      >
        <View style={{ position: "relative" }}>
          <IconSymbol name="bell.fill" size={28} color={colors.tint} />
          {unreadNotificationsCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: colors.destructive,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 6,
              }}
            >
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {unreadNotificationsCount > 99 ?
                  "99+"
                : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/settings")}
      >
        <IconSymbol name="gearshape.fill" size={28} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );
}
