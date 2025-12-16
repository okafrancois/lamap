import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConversationScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const conversation = useQuery(
    (api as any).messaging.getConversations,
    myUserId ? { userId: myUserId } : "skip"
  )?.find((c: any) => c._id === conversationId);

  const messages = useQuery(
    (api as any).messaging.getMessages,
    conversationId ? { conversationId: conversationId as any } : "skip"
  );

  const sendMessage = useMutation((api as any).messaging.sendMessage);
  const markAsRead = useMutation((api as any).messaging.markAsRead);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (conversationId && myUserId) {
      markAsRead({
        conversationId: conversationId as any,
        userId: myUserId,
      }).catch(console.error);
    }
  }, [conversationId, myUserId, markAsRead]);

  useEffect(() => {
    if (messages && messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId || !myUserId || sending) {
      return;
    }

    setSending(true);
    try {
      await sendMessage({
        conversationId: conversationId as any,
        senderId: myUserId,
        content: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (!conversation || !myUserId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </SafeAreaView>
    );
  }

  const otherParticipant = conversation.otherParticipant;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Button
          title="←"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.backButton}
        />
        <Avatar name={otherParticipant?.username || "Utilisateur"} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {otherParticipant?.username || "Utilisateur"}
          </Text>
        </View>
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
          {messages === undefined ?
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.gold} />
            </View>
          : messages.length === 0 ?
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            </View>
          : messages.map((msg: any) => {
              const isMyMessage = msg.sender?._id === myUserId;
              return (
                <View
                  key={msg._id}
                  style={[
                    styles.messageWrapper,
                    isMyMessage ? styles.myMessageWrapper : null,
                  ]}
                >
                  {!isMyMessage && msg.sender && (
                    <Avatar
                      name={msg.sender.username}
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
                    {!isMyMessage && msg.sender && (
                      <Text style={styles.messageUsername}>
                        {msg.sender.username}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : null,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              );
            })
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
            maxLength={500}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.blue,
    gap: 12,
  },
  backButton: {
    minWidth: 40,
    minHeight: 40,
    padding: 0,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.derived.white,
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
