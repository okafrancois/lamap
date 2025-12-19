import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Platform } from "react-native";

export default function UserLayout() {
  const colors = useColors();

  const headerOptions = {
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
    <Stack>
      <Stack.Screen
        name="[userId]"
        options={{
          presentation: "modal",
          title: "Profil",
          ...headerOptions,
        }}
      />
    </Stack>
  );
}

