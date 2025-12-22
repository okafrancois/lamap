import AsyncStorage from "@react-native-async-storage/async-storage";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useSound } from "@/hooks/useSound";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GameChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { userId } = useAuth();
  const { playSound } = useSound();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const messages = useQuery(
    api.chat.getGameMessages,
    gameId ? { gameId } : "skip"
  );

  const sendMessage = useMutation(api.chat.sendGameMessage);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages && messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const updateLastSeenTimestamp = async () => {
      if (!gameId) return;
      try {
        const key = `gameChatLastSeen_${gameId}`;
        const now = Date.now();
        await AsyncStorage.setItem(key, now.toString());
      } catch (error) {
        console.error("Error updating last seen timestamp:", error);
      }
    };
    updateLastSeenTimestamp();
  }, [gameId]);

  const handleSend = async () => {
    if (
      !messageText.trim() ||
      !myUserId ||
      !user?.username ||
      sending ||
      !gameId
    ) {
      return;
    }

    setSending(true);
    try {
      await sendMessage({
        gameId,
        playerId: myUserId,
        playerUsername: user.username,
        message: messageText.trim(),
      });
      setMessageText("");
      playSound("confirmation");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    backButton: {
      minWidth: 40,
      minHeight: 40,
      padding: 0,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
    messageWrapper: {
      flexDirection: "row",
      marginBottom: 12,
      alignItems: "flex-end",
    },
    myMessageWrapper: {
      flexDirection: "row-reverse",
    },
    messageAvatar: {
      marginHorizontal: 8,
    },
    messageBubble: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      maxWidth: "70%",
    },
    myMessageBubble: {
      backgroundColor: colors.secondary,
    },
    messageUsername: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 4,
      fontWeight: "600",
    },
    messageText: {
      fontSize: 14,
      color: colors.text,
    },
    myMessageText: {
      color: colors.secondaryForeground,
    },
    inputContainer: {
      flexDirection: "row",
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
      alignItems: "flex-end",
    },
    input: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 14,
      maxHeight: 100,
    },
    sendButton: {
      minHeight: 44,
      paddingHorizontal: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Button
          title="←"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Chat de la partie</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages && messages.length > 0 ?
            messages.map((msg: any, index: number) => {
              const isMyMessage = msg.playerId === myUserId;
              return (
                <View
                  key={`${msg.timestamp}-${index}`}
                  style={[
                    styles.messageWrapper,
                    isMyMessage ? styles.myMessageWrapper : null,
                  ]}
                >
                  {!isMyMessage && (
                    <Avatar
                      name={msg.playerUsername}
                      size={32}
                      style={styles.messageAvatar}
                    />
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isMyMessage ? styles.myMessageBubble : null,
                    ]}
                  >
                    {!isMyMessage && (
                      <Text style={styles.messageUsername}>
                        {msg.playerUsername}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : null,
                      ]}
                    >
                      {msg.message}
                    </Text>
                  </View>
                </View>
              );
            })
          : <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            </View>
          }
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Tapez un message..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={200}
            onSubmitEditing={handleSend}
          />
          <Button
            title="Envoyer"
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
            loading={sending}
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
