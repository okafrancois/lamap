import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "person.circle.fill": "account-circle",
  "gearshape.fill": "settings",
  "clock.fill": "history",
  "gamecontroller.fill": "sports-esports",
  "message.fill": "message",
  "wallet.pass.fill": "account-balance-wallet",
  "person.fill": "person",
  "person.2.fill": "people",
  "pencil.circle.fill": "edit",
  "dollarsign.circle.fill": "account-balance-wallet",
  "circle.fill": "lens",
  scope: "track-changes",
  "trophy.fill": "emoji-events",
  "chart.bar": "bar-chart",
  "star.fill": "star",
  "flame.fill": "local-fire-department",
  "drop.fill": "water-drop",
  "suit.spade.fill": "spa",
  "hand.raised.fill": "pan-tool",
  "bolt.fill": "bolt",
  "bell.fill": "notifications",
  "bell.slash.fill": "notifications-off",
  "exclamationmark.triangle.fill": "warning",
  "hourglass.tophalf.fill": "hourglass-top",
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]!}
      style={style}
    />
  );
}
