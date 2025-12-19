import { useAuth } from "@/hooks/useAuth";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export const unstable_settings = {
  initialRouteName: "username",
};

export default function OnboardingLayout() {
  const { isSignedIn, isLoaded, isConvexUserLoaded, convexUser } = useAuth();

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

  if (isSignedIn && convexUser && convexUser.onboardingCompleted === true) {
    return <Redirect href="/(tabs)/index" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="username" />
      <Stack.Screen name="country" />
    </Stack>
  );
}
