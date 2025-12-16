import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function SSOCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(tabs)");
  }, [router]);

  return <View />;
}

