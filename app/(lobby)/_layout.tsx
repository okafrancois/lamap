import { TopBar } from "@/components/ui/TopBar";
import { Stack } from "expo-router";

export default function LobbyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: () => <TopBar />,
      }}
    >
      <Stack.Screen name="select-mode" />
      <Stack.Screen name="select-bet" />
      <Stack.Screen name="select-difficulty" />
      <Stack.Screen name="matchmaking" />
      <Stack.Screen
        name="room/[roomId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="create-friendly" />
      <Stack.Screen name="join-friendly" />
    </Stack>
  );
}
