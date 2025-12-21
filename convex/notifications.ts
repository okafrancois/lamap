import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

let pushNotifications: PushNotifications<Id<"users">> | null = null;

function getPushNotifications(): PushNotifications<Id<"users">> {
  if (!pushNotifications) {
    pushNotifications = new PushNotifications(components.pushNotifications);
  }
  return pushNotifications;
}

export const recordPushNotificationToken = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const pn = getPushNotifications();
    await pn.recordToken(ctx, {
      userId: args.userId,
      pushToken: args.token,
    });

    return { success: true };
  },
});

export const sendPushNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const pn = getPushNotifications();
    const pushId = await pn.sendPushNotification(ctx, {
      userId: args.userId,
      notification: {
        title: args.title,
        body: args.body,
        data: args.data,
      },
    });

    return { pushId };
  },
});

export const sendChallengeNotification = internalMutation({
  args: {
    challengedUserId: v.id("users"),
    challengerUsername: v.string(),
    mode: v.union(v.literal("RANKED"), v.literal("CASH")),
  },
  handler: async (ctx, args) => {
    const pn = getPushNotifications();

    const title = "Nouveau défi reçu !";
    const body =
      args.mode === "RANKED" ?
        `${args.challengerUsername} vous défie en partie classée`
      : `${args.challengerUsername} vous défie en partie cash`;

    try {
      const pushId = await pn.sendPushNotification(ctx, {
        userId: args.challengedUserId,
        notification: {
          title,
          body,
          data: {
            type: "challenge",
            mode: args.mode,
            route: "/(tabs)/profile",
          },
        },
      });
      return { pushId, success: true };
    } catch (error) {
      console.error("Error sending challenge notification:", error);
      return { success: false };
    }
  },
});

export const sendRevengeRequestNotification = internalMutation({
  args: {
    receiverUserId: v.id("users"),
    senderUsername: v.string(),
    mode: v.union(v.literal("RANKED"), v.literal("CASH")),
  },
  handler: async (ctx, args) => {
    const pn = getPushNotifications();

    const title = "Proposition de revanche !";
    const body =
      args.mode === "RANKED" ?
        `${args.senderUsername} veut une revanche en partie classée`
      : `${args.senderUsername} veut une revanche en partie cash`;

    try {
      const pushId = await pn.sendPushNotification(ctx, {
        userId: args.receiverUserId,
        notification: {
          title,
          body,
          data: {
            type: "revenge_request",
            mode: args.mode,
          },
        },
      });
      return { pushId, success: true };
    } catch (error) {
      console.error("Error sending revenge request notification:", error);
      return { success: false };
    }
  },
});

export const sendMessageNotification = internalMutation({
  args: {
    receiverUserId: v.id("users"),
    senderUsername: v.string(),
    messagePreview: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const pn = getPushNotifications();

    const title = `Message de ${args.senderUsername}`;
    const body =
      args.messagePreview.length > 100 ?
        args.messagePreview.substring(0, 100) + "..."
      : args.messagePreview;

    try {
      const pushId = await pn.sendPushNotification(ctx, {
        userId: args.receiverUserId,
        notification: {
          title,
          body,
          data: {
            type: "message",
            route: `/(messages)/${args.conversationId}`,
          },
        },
      });
      return { pushId, success: true };
    } catch (error) {
      console.error("Error sending message notification:", error);
      return { success: false };
    }
  },
});

export const sendMatchFoundNotification = internalMutation({
  args: {
    userId: v.id("users"),
    opponentUsername: v.string(),
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const pn = getPushNotifications();

    const title = "Match trouvé !";
    const body = `Vous allez jouer contre ${args.opponentUsername}`;

    try {
      const pushId = await pn.sendPushNotification(ctx, {
        userId: args.userId,
        notification: {
          title,
          body,
          data: {
            type: "match_found",
            route: "/(tabs)",
          },
        },
      });
      return { pushId, success: true };
    } catch (error) {
      console.error("Error sending match found notification:", error);
      return { success: false };
    }
  },
});

export const sendTurnNotification = internalMutation({
  args: {
    userId: v.id("users"),
    gameId: v.string(),
    timeRemaining: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pn = getPushNotifications();

    const title = "C'est votre tour !";
    const body =
      args.timeRemaining && args.timeRemaining < 60 ?
        `Il vous reste ${args.timeRemaining} secondes`
      : "C'est votre tour de jouer";

    try {
      const pushId = await pn.sendPushNotification(ctx, {
        userId: args.userId,
        notification: {
          title,
          body,
          data: {
            type: "turn",
            gameId: args.gameId,
            route: `/(game)/match/${args.gameId}`,
          },
        },
      });
      return { pushId, success: true };
    } catch (error) {
      console.error("Error sending turn notification:", error);
      return { success: false };
    }
  },
});

export const getNotificationsForUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.runQuery(
      components.pushNotifications.public.getNotificationsForUser,
      {
        userId: args.userId as any,
        limit: args.limit || 50,
        logLevel: "INFO" as const,
      }
    );
    return notifications;
  },
});
