import { TopBar } from "@/components/ui/TopBar";
import { Stack } from "expo-router";

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
