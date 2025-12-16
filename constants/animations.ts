export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const AnimationCurves = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const, // cubic-bezier(0.16, 1, 0.3, 1)
  easeInOutSmooth: [0.4, 0, 0.2, 1] as const, // cubic-bezier(0.4, 0, 0.2, 1)
  easeSpring: [0.34, 1.56, 0.64, 1] as const, // cubic-bezier(0.34, 1.56, 0.64, 1)
};

export const AnimationValues = {
  // Card Pulse
  cardPulse: {
    duration: 2000,
    type: 'ease-in-out' as const,
  },
  
  // Coin Flip
  coinFlip: {
    duration: 600,
    type: 'ease-in-out' as const,
  },
  
  // Float Animations
  floatSlow: {
    duration: 6000,
    range: [7000, 8000],
  },
  floatMedium: {
    duration: 5000,
    range: [4000, 6000],
  },
  floatFast: {
    duration: 3500,
    range: [3000, 4000],
  },
  
  // Slide Up
  slideUp: {
    duration: 300,
    type: 'ease-out' as const,
  },
  
  // Fade In
  fadeIn: {
    duration: 200,
    type: 'ease-out' as const,
  },
  
  // Shake
  shake: {
    duration: 500,
    type: 'ease-in-out' as const,
  },
  
  // Pulse Soft
  pulseSoft: {
    duration: 3000,
    type: 'ease-in-out' as const,
  },
  
  // Shine (Brillance)
  shine: {
    duration: 3000,
    type: 'infinite' as const,
  },
};

