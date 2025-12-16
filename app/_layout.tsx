import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

const convex = new ConvexReactClient(convexUrl);

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  if (!clerkPublishableKey) {
    console.warn("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  if (!convexUrl) {
    console.warn("Missing EXPO_PUBLIC_CONVEX_URL");
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <ConvexProvider client={convex}>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(lobby)" options={{ headerShown: false }} />
              <Stack.Screen name="(game)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(messages)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  presentation: "modal",
                  headerShown: false,
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ConvexProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
