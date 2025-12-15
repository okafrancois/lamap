import { api } from "@/convex/_generated/api";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

export function useAuth() {
  const { userId, isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : "skip"
  );

  useEffect(() => {
    if (isLoaded && isSignedIn && userId && user) {
      createOrUpdateUser({
        clerkId: userId,
        username:
          user.username ||
          user.firstName ||
          user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          "User",
        phone: user.primaryPhoneNumber?.phoneNumber,
        email: user.primaryEmailAddress?.emailAddress,
      }).catch((error) => {
        console.error("Error creating/updating user:", error);
      });
    }
  }, [isLoaded, isSignedIn, userId, user, createOrUpdateUser]);

  return {
    userId,
    isLoaded,
    isSignedIn,
    user: currentUser,
    clerkUser: user,
  };
}
