import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const {
    isSignedIn,
    isLoaded,
    isConvexUserLoaded,
    needsOnboarding,
    convexUser,
  } = useAuth();

  const isLoading =
    !isLoaded ||
    (isSignedIn &&
      (!isConvexUserLoaded ||
        convexUser === null ||
        needsOnboarding === undefined));

  if (isLoading) {
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
    if (needsOnboarding === true) {
      return <Redirect href="/(onboarding)/username" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
