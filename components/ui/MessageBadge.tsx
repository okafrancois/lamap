import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function MessageBadge() {
  const colors = useColors();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );

  const conversations = useQuery(
    api.messaging.getConversations,
    user?._id ? { userId: user._id } : "skip"
  );

  const unreadCount =
    conversations?.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) ||
    0;

  if (unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
        {unreadCount > 99 ? "99+" : unreadCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

