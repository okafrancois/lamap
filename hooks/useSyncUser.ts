import { api } from "@/convex/_generated/api";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

/**
 * Hook to sync user from Clerk to Convex if they don't exist yet
 * Returns sync status and ensures user is created/updated in Convex
 */
export function useSyncUser() {
  const { userId, isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    userId && isLoaded && isSignedIn ? { clerkUserId: userId } : "skip"
  );

  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !clerkUser) {
      return;
    }

    if (currentUser !== undefined) {
      return;
    }

    const syncUser = async () => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        await createOrUpdateUser({
          clerkId: userId,
          username:
            clerkUser.username ||
            clerkUser.firstName ||
            clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            "User",
          phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          email: clerkUser.primaryEmailAddress?.emailAddress,
        });
      } catch (error) {
        console.error("Error syncing user to Convex:", error);
        setSyncError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [
    isLoaded,
    isSignedIn,
    userId,
    clerkUser,
    currentUser,
    createOrUpdateUser,
  ]);

  return {
    isSyncing,
    syncError,
    isSynced: currentUser !== undefined && currentUser !== null,
  };
}
