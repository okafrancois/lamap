import { useColors } from "@/hooks/useColors";
import {
  ClerkProvider,
  useAuth,
  useAuth as useClerkAuth,
} from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

const convex = new ConvexReactClient(convexUrl);

// Removed anchor to ensure index.tsx is always rendered for onboarding check
// export const unstable_settings = {
//   anchor: "(tabs)",
// };

function RootLayoutNav() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const colors = useColors();

  if (!isLoaded) {
    return null;
  }

  const modalHeaderOptions = {
    headerStyle: {
      backgroundColor: colors.background,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
    },
    headerTintColor: colors.secondary,
    headerTitleStyle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: colors.secondary,
    },
    headerShadowVisible: false,
    contentStyle: {
      backgroundColor: colors.background,
    },
    ...(Platform.OS === "android" && {
      headerTitleAlign: "center" as const,
      headerBackTitleVisible: false,
    }),
  };

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(lobby)" options={{ headerShown: false }} />
          <Stack.Screen name="(game)" options={{ headerShown: false }} />
          <Stack.Screen name="(messages)" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{
              presentation: "modal",
              title: "Paramètres",
              ...modalHeaderOptions,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              presentation: "modal",
              title: "Mon Profil",
              ...modalHeaderOptions,
            }}
          />
          <Stack.Screen
            name="user/[userId]"
            options={{
              presentation: "modal",
              title: "Profil",
              ...modalHeaderOptions,
            }}
          />
        </Stack.Protected>
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  if (!clerkPublishableKey) {
    console.warn("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  if (!convexUrl) {
    console.warn("Missing EXPO_PUBLIC_CONVEX_URL");
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <RootLayoutNav />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
