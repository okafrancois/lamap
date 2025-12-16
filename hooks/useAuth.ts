import { api } from "@/convex/_generated/api";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";

export function useAuth() {
  const { userId, isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    userId && isLoaded && isSignedIn ? { clerkId: userId } : "skip"
  );

  return {
    userId,
    isLoaded,
    isSignedIn,
    user: currentUser,
    clerkUser,
  };
}
