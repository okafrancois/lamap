import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "./icon-symbol";

export function TopBar() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: insets.top,
      paddingBottom: 6,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    button: {
      padding: 8,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/profile")}
      >
        <IconSymbol name="person.circle.fill" size={28} color={colors.tint} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/settings")}
      >
        <IconSymbol name="gearshape.fill" size={28} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );
}
