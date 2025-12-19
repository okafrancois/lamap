import { api } from "@/convex/_generated/api";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";

export function useAuth() {
  const { userId, isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId && isLoaded && isSignedIn ? { clerkUserId: userId } : "skip"
  );

  // Si l'utilisateur existe et n'a pas complété l'onboarding
  const needsOnboarding = convexUser ? !convexUser.onboardingCompleted : undefined;
  
  // L'utilisateur Convex est chargé si :
  // - Pas connecté (pas besoin d'attendre)
  // - Ou connecté ET convexUser existe (ou null si vraiment pas trouvé après plusieurs tentatives)
  const isConvexUserLoaded = !isSignedIn || convexUser !== undefined;

  return {
    userId,
    isLoaded,
    isSignedIn,
    user: convexUser,
    convexUser,
    clerkUser,
    needsOnboarding,
    isConvexUserLoaded,
  };
}
