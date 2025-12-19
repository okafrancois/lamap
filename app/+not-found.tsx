import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { Unmatched, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFound() {
  const colors = useColors();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Unmatched />
        <View style={styles.messageContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Page introuvable
          </Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </Text>
        </View>
        <Button
          title="Retour à l'accueil"
          onPress={() => router.push("/(tabs)/index")}
          variant="primary"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 24,
  },
  messageContainer: {
    alignItems: "center",
    gap: 8,
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
  },
});
