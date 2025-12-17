import { useColors } from "@/hooks/useColors";
import React from "react";
import { Image, ImageStyle, Text, View, ViewStyle } from "react-native";

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: number;
  style?: ViewStyle;
  variant?: "primary" | "secondary" | "default";
}

export function Avatar({
  name,
  imageUrl,
  size = 40,
  style,
  variant = "default",
}: AvatarProps) {
  const colors = useColors();
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const baseStyle: ViewStyle = {
    backgroundColor:
      variant === "default" ? colors.card
      : variant === "primary" ? colors.primary
      : colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const initialsStyle = {
    color: colors.text,
    fontWeight: "600" as const,
    fontSize: size * 0.4,
  };

  if (imageUrl) {
    return (
      <View style={[baseStyle, style]}>
        <Image
          source={{ uri: imageUrl }}
          style={imageStyle}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[baseStyle, style]}>
      <Text style={initialsStyle}>{initials}</Text>
    </View>
  );
}
