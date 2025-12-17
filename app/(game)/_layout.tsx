import { Stack } from "expo-router";

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="match/[matchId]" />
      <Stack.Screen
        name="chat/[gameId]"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="replay/[gameId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
