/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiPlayer from "../aiPlayer.js";
import type * as chat from "../chat.js";
import type * as currencies from "../currencies.js";
import type * as economy from "../economy.js";
import type * as friendlyMatches from "../friendlyMatches.js";
import type * as friends from "../friends.js";
import type * as gameChat from "../gameChat.js";
import type * as gameEngine from "../gameEngine.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as matchmaking from "../matchmaking.js";
import type * as messaging from "../messaging.js";
import type * as onboarding from "../onboarding.js";
import type * as ranking from "../ranking.js";
import type * as recharge from "../recharge.js";
import type * as timer from "../timer.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiPlayer: typeof aiPlayer;
  chat: typeof chat;
  currencies: typeof currencies;
  economy: typeof economy;
  friendlyMatches: typeof friendlyMatches;
  friends: typeof friends;
  gameChat: typeof gameChat;
  gameEngine: typeof gameEngine;
  games: typeof games;
  http: typeof http;
  matchmaking: typeof matchmaking;
  messaging: typeof messaging;
  onboarding: typeof onboarding;
  ranking: typeof ranking;
  recharge: typeof recharge;
  timer: typeof timer;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
