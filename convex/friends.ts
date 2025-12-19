import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

function getOrderedUserIds(userId1: Id<"users">, userId2: Id<"users">) {
  return userId1 < userId2 ?
      { user1Id: userId1, user2Id: userId2 }
    : { user1Id: userId2, user2Id: userId1 };
}

export const sendFriendRequest = mutation({
  args: {
    senderId: v.id("users"),
    receiverUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const receiver = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.receiverUsername))
      .first();

    if (!receiver) {
      throw new Error("User not found");
    }

    if (receiver._id === args.senderId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", args.senderId).eq("receiverId", receiver._id)
      )
      .first();

    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    const reverseRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", receiver._id).eq("receiverId", args.senderId)
      )
      .first();

    if (reverseRequest) {
      throw new Error("This user has already sent you a friend request");
    }

    const { user1Id, user2Id } = getOrderedUserIds(args.senderId, receiver._id);
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("user1Id", user1Id).eq("user2Id", user2Id)
      )
      .first();

    if (existingFriendship) {
      throw new Error("Already friends");
    }

    const requestId = await ctx.db.insert("friendRequests", {
      senderId: args.senderId,
      receiverId: receiver._id,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true, requestId };
  },
});

export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.receiverId !== args.userId) {
      throw new Error("Not authorized to accept this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    const { user1Id, user2Id } = getOrderedUserIds(
      request.senderId,
      request.receiverId
    );
    await ctx.db.insert("friendships", {
      user1Id,
      user2Id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const rejectFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.receiverId !== args.userId) {
      throw new Error("Not authorized to reject this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      respondedAt: Date.now(),
    });

    return { success: true };
  },
});

export const cancelFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.senderId !== args.userId) {
      throw new Error("Not authorized to cancel this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.delete(args.requestId);

    return { success: true };
  },
});

export const removeFriend = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user1Id, user2Id } = getOrderedUserIds(args.userId, args.friendId);

    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("user1Id", user1Id).eq("user2Id", user2Id)
      )
      .first();

    if (!friendship) {
      throw new Error("Friendship not found");
    }

    await ctx.db.delete(friendship._id);

    return { success: true };
  },
});

export const getFriends = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const friendshipsAsUser1 = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.userId))
      .collect();

    const friendshipsAsUser2 = await ctx.db
      .query("friendships")
      .withIndex("by_user2", (q) => q.eq("user2Id", args.userId))
      .collect();

    const friendIds = [
      ...friendshipsAsUser1.map((f) => f.user2Id),
      ...friendshipsAsUser2.map((f) => f.user1Id),
    ];

    const friends = await Promise.all(
      friendIds.map(async (friendId) => {
        const friend = await ctx.db.get(friendId);
        if (!friend) return null;

        return {
          _id: friend._id,
          username: friend.username,
          avatarUrl: friend.avatarUrl,
          pr: friend.pr,
          isActive: friend.isActive,
        };
      })
    );

    return friends.filter((f) => f !== null);
  },
});

export const getReceivedFriendRequests = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithSender = await Promise.all(
      requests.map(async (request) => {
        const sender = await ctx.db.get(request.senderId);
        if (!sender) return null;

        return {
          _id: request._id,
          sender: {
            _id: sender._id,
            username: sender.username,
            avatarUrl: sender.avatarUrl,
            pr: sender.pr,
          },
          createdAt: request.createdAt,
        };
      })
    );

    return requestsWithSender.filter((r) => r !== null);
  },
});

export const getSentFriendRequests = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithReceiver = await Promise.all(
      requests.map(async (request) => {
        const receiver = await ctx.db.get(request.receiverId);
        if (!receiver) return null;

        return {
          _id: request._id,
          receiver: {
            _id: receiver._id,
            username: receiver.username,
            avatarUrl: receiver.avatarUrl,
            pr: receiver.pr,
          },
          createdAt: request.createdAt,
        };
      })
    );

    return requestsWithReceiver.filter((r) => r !== null);
  },
});

export const areFriends = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user1Id, user2Id } = getOrderedUserIds(
      args.userId,
      args.otherUserId
    );

    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("user1Id", user1Id).eq("user2Id", user2Id)
      )
      .first();

    return !!friendship;
  },
});

export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    currentUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const allUsers = await ctx.db.query("users").collect();

    const searchLower = args.searchTerm.toLowerCase();
    const matchingUsers = allUsers
      .filter(
        (user) =>
          user._id !== args.currentUserId &&
          user.username.toLowerCase().includes(searchLower)
      )
      .slice(0, limit);

    const usersWithStatus = await Promise.all(
      matchingUsers.map(async (user) => {
        const { user1Id, user2Id } = getOrderedUserIds(
          args.currentUserId,
          user._id
        );

        const friendship = await ctx.db
          .query("friendships")
          .withIndex("by_users", (q) =>
            q.eq("user1Id", user1Id).eq("user2Id", user2Id)
          )
          .first();

        if (friendship) {
          return {
            _id: user._id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            pr: user.pr,
            status: "friends" as const,
          };
        }

        const sentRequest = await ctx.db
          .query("friendRequests")
          .withIndex("by_sender_receiver", (q) =>
            q.eq("senderId", args.currentUserId).eq("receiverId", user._id)
          )
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first();

        if (sentRequest) {
          return {
            _id: user._id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            pr: user.pr,
            status: "request_sent" as const,
          };
        }

        const receivedRequest = await ctx.db
          .query("friendRequests")
          .withIndex("by_sender_receiver", (q) =>
            q.eq("senderId", user._id).eq("receiverId", args.currentUserId)
          )
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first();

        if (receivedRequest) {
          return {
            _id: user._id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            pr: user.pr,
            status: "request_received" as const,
          };
        }

        return {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          pr: user.pr,
          status: "none" as const,
        };
      })
    );

    return usersWithStatus;
  },
});
