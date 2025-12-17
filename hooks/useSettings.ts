import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const SETTINGS_KEY = "@lamap:settings";

export type ThemeMode = "light" | "dark" | "system";
export type CardLayout = "fan" | "linear" | "compact";
export type PlayAreaMode = "battle" | "history";
export type BattleLayout = "vertical" | "horizontal";

interface Settings {
  themeMode: ThemeMode;
  cardLayout: CardLayout;
  playAreaMode: PlayAreaMode;
  battleLayout: BattleLayout;
}

const defaultSettings: Settings = {
  themeMode: "system",
  cardLayout: "fan",
  playAreaMode: "battle",
  battleLayout: "vertical",
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    updateSettings({ themeMode: mode });
  };

  const setCardLayout = (layout: CardLayout) => {
    updateSettings({ cardLayout: layout });
  };

  const setPlayAreaMode = (mode: PlayAreaMode) => {
    updateSettings({ playAreaMode: mode });
  };

  const setBattleLayout = (layout: BattleLayout) => {
    updateSettings({ battleLayout: layout });
  };

  return {
    themeMode: settings.themeMode,
    cardLayout: settings.cardLayout,
    playAreaMode: settings.playAreaMode,
    battleLayout: settings.battleLayout,
    setThemeMode,
    setCardLayout,
    setPlayAreaMode,
    setBattleLayout,
    isLoading,
  };
}
