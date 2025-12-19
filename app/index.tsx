import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded, isConvexUserLoaded, needsOnboarding } =
    useAuth();

  // Attendre que Clerk ET Convex soient chargés
  if (!isLoaded || (isSignedIn && !isConvexUserLoaded)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#141923",
        }}
      >
        <ActivityIndicator size="large" color="#A68258" />
      </View>
    );
  }

  if (isSignedIn) {
    // Si needsOnboarding est true, rediriger vers onboarding
    if (needsOnboarding) {
      return <Redirect href="/(onboarding)/username" />;
    }

    // Sinon, aller vers les tabs
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
