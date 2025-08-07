import type { inferRouterOutputs } from "@trpc/server";
import type { gameRouter } from "./game";

export type GameState = inferRouterOutputs<typeof gameRouter>["getGame"];
