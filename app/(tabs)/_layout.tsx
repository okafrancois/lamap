import { Tabs } from "expo-router";
import React from "react";
import { BlurView } from "expo-blur";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TopBar } from "@/components/ui/TopBar";
import { useColors } from "@/hooks/useColors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: true,
        header: () => <TopBar />,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        ),
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Jouer",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gamecontroller.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="message.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Portefeuille",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="wallet.pass.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Mes parties",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="clock.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
