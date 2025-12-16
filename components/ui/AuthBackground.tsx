import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

const SUIT_IMAGES = {
  spades: require("@/assets/images/suit_spade.svg"),
  clubs: require("@/assets/images/suit_club.svg"),
  hearts: require("@/assets/images/suit_heart.svg"),
  diamonds: require("@/assets/images/suit_diamond.svg"),
};

export function AuthBackground() {
  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FAFAF9" stopOpacity="1" />
            <Stop offset="100%" stopColor="#F5F2ED" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect width="100%" height="100%" fill="url(#bgGradient)" />

        <Circle cx="50" cy="150" r="60" fill="#D9D1C4" opacity="0.08" />
        <Circle cx="320" cy="100" r="80" fill="#D9D1C4" opacity="0.06" />
        <Circle cx="280" cy="700" r="100" fill="#C9A876" opacity="0.05" />
        <Circle cx="100" cy="600" r="70" fill="#D4635D" opacity="0.04" />

        <Circle cx="50" cy="400" r="2" fill="#A68258" opacity="0.15" />
        <Circle cx="340" cy="300" r="3" fill="#B4443E" opacity="0.12" />
        <Circle cx="180" cy="180" r="2" fill="#A68258" opacity="0.15" />
        <Circle cx="280" cy="500" r="2" fill="#D9D1C4" opacity="0.15" />
        <Circle cx="120" cy="720" r="2" fill="#B4443E" opacity="0.1" />
      </Svg>

      <Image
        source={SUIT_IMAGES.hearts}
        style={[styles.suitIcon, { top: 80, left: 40, width: 60, height: 60 }]}
        contentFit="contain"
      />
      <Image
        source={SUIT_IMAGES.spades}
        style={[
          styles.suitIcon,
          { top: 150, right: 30, width: 80, height: 80 },
        ]}
        contentFit="contain"
      />
      <Image
        source={SUIT_IMAGES.diamonds}
        style={[styles.suitIcon, { top: 300, left: 20, width: 50, height: 50 }]}
        contentFit="contain"
      />
      <Image
        source={SUIT_IMAGES.clubs}
        style={[
          styles.suitIcon,
          { top: 450, right: 50, width: 70, height: 70 },
        ]}
        contentFit="contain"
      />
      <Image
        source={SUIT_IMAGES.hearts}
        style={[
          styles.suitIcon,
          { bottom: 200, left: 60, width: 55, height: 55 },
        ]}
        contentFit="contain"
      />
      <Image
        source={SUIT_IMAGES.spades}
        style={[
          styles.suitIcon,
          { bottom: 150, right: 40, width: 65, height: 65 },
        ]}
        contentFit="contain"
      />
      <Image
        source={SUIT_IMAGES.diamonds}
        style={[styles.suitIcon, { top: 200, left: 70, width: 45, height: 45 }]}
        contentFit="contain"
      />
      <Image
        source={SUIT_IMAGES.clubs}
        style={[styles.suitIcon, { top: 550, left: 50, width: 60, height: 60 }]}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  suitIcon: {
    position: "absolute",
    opacity: 0.08,
  },
});
