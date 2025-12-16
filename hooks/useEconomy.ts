import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

export function useEconomy() {
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const transactions = useQuery(
    api.economy.getTransactionHistory,
    myUserId ? { userId: myUserId } : "skip"
  );

  return {
    balance: user?.balance || 0,
    currency: user?.currency || "XAF",
    transactions: transactions || [],
  };
}

