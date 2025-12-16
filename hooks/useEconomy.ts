import { useMutation, useQuery } from "convex/react";
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

  const redeemRechargeCodeMutation = useMutation(api.recharge.redeemRechargeCode);

  const redeemCode = async (code: string) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await redeemRechargeCodeMutation({
      userId: myUserId,
      code,
    });
  };

  return {
    balance: user?.balance || 0,
    currency: user?.currency || "XAF",
    transactions: transactions || [],
    redeemCode,
  };
}

