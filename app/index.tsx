import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded, convexUser, needsOnboarding } = useAuth();

  if (!isLoaded) {
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
    if (!convexUser) {
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

    if (needsOnboarding) {
      return <Redirect href="/(onboarding)/username" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
