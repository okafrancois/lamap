import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="match/[matchId]" />
      <Stack.Screen name="result/[matchId]" />
    </Stack>
  );
}

