import { Stack } from 'expo-router';
import { TopBar } from "@/components/ui/TopBar";

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: () => <TopBar />,
      }}
    >
      <Stack.Screen name="[conversationId]" />
    </Stack>
  );
}

