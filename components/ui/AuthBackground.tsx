import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export function AuthBackground() {
  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#2E3D4D" stopOpacity="1" />
            <Stop offset="100%" stopColor="#141923" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        <Rect width="100%" height="100%" fill="url(#bgGradient)" />
        
        <Circle cx="50" cy="150" r="60" fill="#465D74" opacity="0.08" />
        <Circle cx="320" cy="100" r="80" fill="#465D74" opacity="0.06" />
        <Circle cx="280" cy="700" r="100" fill="#A68258" opacity="0.05" />
        <Circle cx="100" cy="600" r="70" fill="#B4443E" opacity="0.04" />
        
        <Path
          d="M 60 220 L 90 220 L 75 250 Z"
          fill="#465D74"
          opacity="0.1"
        />
        <Path
          d="M 300 650 L 340 650 L 320 690 Z"
          fill="#465D74"
          opacity="0.08"
        />
        
        <Circle cx="50" cy="400" r="3" fill="#A68258" opacity="0.3" />
        <Circle cx="340" cy="300" r="4" fill="#B4443E" opacity="0.25" />
        <Circle cx="180" cy="180" r="2" fill="#A68258" opacity="0.35" />
        <Circle cx="280" cy="500" r="3" fill="#465D74" opacity="0.3" />
        <Circle cx="120" cy="720" r="2" fill="#B4443E" opacity="0.2" />
        
        <Path
          d="M 200 400 L 210 410 M 210 400 L 200 410"
          stroke="#465D74"
          strokeWidth="3"
          opacity="0.12"
        />
        
        <Path
          d="M 150 650 L 150 680 M 135 665 L 165 665"
          stroke="#465D74"
          strokeWidth="3"
          opacity="0.1"
        />
        
        <Circle cx="300" cy="450" r="15" fill="none" stroke="#465D74" strokeWidth="2" opacity="0.1" />
        <Circle cx="80" cy="320" r="20" fill="none" stroke="#A68258" strokeWidth="2" opacity="0.08" />
        
        <Path
          d="M 250 200 Q 260 210, 250 220 Q 240 210, 250 200"
          fill="#B4443E"
          opacity="0.08"
        />
        
        <Path
          d="M 320 550 L 330 550 L 335 560 L 330 570 L 320 570 L 315 560 Z"
          fill="#465D74"
          opacity="0.1"
        />
        
        <Path
          d="M 100 500 L 105 510 L 100 520 L 95 510 Z"
          fill="#A68258"
          opacity="0.12"
        />
      </Svg>
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
});

