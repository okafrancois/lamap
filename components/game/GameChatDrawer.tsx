import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";

interface GameChatDrawerProps {
  gameId: string;
  visible: boolean;
  onClose: () => void;
}

export function GameChatDrawer({
  gameId,
  visible,
  onClose,
}: GameChatDrawerProps) {
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const messages = useQuery(api.chat.getGameMessages, {
    gameId,
  });

  const sendMessage = useMutation(api.chat.sendGameMessage);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(400, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, opacity]);

  useEffect(() => {
    if (messages && messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleSend = async () => {
    if (!messageText.trim() || !myUserId || !user?.username || sending) {
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
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View style={[styles.drawer, drawerStyle]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chat de la partie</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

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
                <Text style={styles.emptyText}>
                  Aucun message pour le moment
                </Text>
              </View>
            }
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Tapez un message..."
              placeholderTextColor={Colors.derived.blueLight}
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: {
    flex: 1,
  },
  drawer: {
    backgroundColor: Colors.derived.blueDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 0 : 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.blue,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.derived.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.derived.white,
    fontWeight: "700",
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
    color: Colors.derived.blueLight,
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
    backgroundColor: Colors.primary.blue,
    borderRadius: 16,
    padding: 12,
    maxWidth: "70%",
  },
  myMessageBubble: {
    backgroundColor: Colors.primary.gold,
  },
  messageUsername: {
    fontSize: 12,
    color: Colors.derived.blueLight,
    marginBottom: 4,
    fontWeight: "600",
  },
  messageText: {
    fontSize: 14,
    color: Colors.derived.white,
  },
  myMessageText: {
    color: Colors.derived.blueDark,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.primary.blue,
    gap: 12,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.primary.blue,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.derived.white,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    minHeight: 44,
    paddingHorizontal: 20,
  },
});
