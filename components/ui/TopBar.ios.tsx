import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "./icon-symbol";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
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
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    titleContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
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
      <View style={styles.titleContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/settings")}
      >
        <IconSymbol name="gearshape.fill" size={28} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );
}
