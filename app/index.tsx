import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const router = useRouter();
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
      router.push("/(onboarding)/username");
    }

    router.push("/(tabs)/index");
  } else {
    router.push("/welcome");
  }
}
