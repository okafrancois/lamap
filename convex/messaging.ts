import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const createConversation = mutation({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.userId1 === args.userId2) {
      throw new Error("Cannot create conversation with yourself");
    }

    const participants = [args.userId1, args.userId2].sort();

    const allConversations = await ctx.db.query("conversations").collect();
    const existing = allConversations.find(
      (conv) =>
        conv.participants.length === 2 &&
        conv.participants.includes(args.userId1) &&
        conv.participants.includes(args.userId2)
    );

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      participants,
      lastMessageAt: now,
      createdAt: now,
    });

    return conversationId;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.content.trim()) {
      throw new Error("Message cannot be empty");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participants.includes(args.senderId)) {
      throw new Error("Sender not in conversation");
    }

    const now = Date.now();

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content.trim(),
      timestamp: now,
      read: false,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
    });

    // Envoyer une notification push au destinataire
    const receiverId = conversation.participants.find(
      (id) => id !== args.senderId
    );
    if (receiverId) {
      const sender = await ctx.db.get(args.senderId);
      if (sender) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendMessageNotification,
          {
            receiverUserId: receiverId,
            senderUsername: sender.username,
            messagePreview: args.content.trim(),
          }
        );
      }
    }

    return { success: true };
  },
});

export const getConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_last_message")
      .collect();

    const userConversations = allConversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    const conversationsWithData = await Promise.all(
      userConversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(
          (id) => id !== args.userId
        );
        const otherParticipant =
          otherParticipantId ? await ctx.db.get(otherParticipantId) : null;

        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .first();

        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .filter((q) => q.eq(q.field("read"), false))
          .filter((q) => q.neq(q.field("senderId"), args.userId))
          .collect()
          .then((msgs) => msgs.length);

        return {
          _id: conv._id,
          otherParticipant:
            otherParticipant ?
              {
                _id: otherParticipant._id,
                username: otherParticipant.username,
                avatarUrl: otherParticipant.avatarUrl,
              }
            : null,
          lastMessage:
            lastMessage ?
              {
                content: lastMessage.content,
                timestamp: lastMessage.timestamp,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount,
          lastMessageAt: conv.lastMessageAt,
        };
      })
    );

    return conversationsWithData.sort(
      (a, b) => b.lastMessageAt - a.lastMessageAt
    );
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          _id: msg._id,
          content: msg.content,
          timestamp: msg.timestamp,
          read: msg.read,
          sender:
            sender ?
              {
                _id: sender._id,
                username: sender.username,
                avatarUrl: sender.avatarUrl,
              }
            : null,
        };
      })
    );

    return messagesWithSenders;
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("read"), false))
      .filter((q) => q.neq(q.field("senderId"), args.userId))
      .collect();

    await Promise.all(
      messages.map((msg) =>
        ctx.db.patch(msg._id, {
          read: true,
        })
      )
    );

    return { success: true };
  },
});
