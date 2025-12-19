export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const AnimationCurves = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeInOutSmooth: [0.4, 0, 0.2, 1] as const,
  easeSpring: [0.34, 1.56, 0.64, 1] as const,
};

export const AnimationValues = {
  cardPulse: {
    duration: 2000,
    type: "ease-in-out" as const,
  },

  coinFlip: {
    duration: 600,
    type: "ease-in-out" as const,
  },

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

  slideUp: {
    duration: 300,
    type: "ease-out" as const,
  },

  fadeIn: {
    duration: 200,
    type: "ease-out" as const,
  },

  shake: {
    duration: 500,
    type: "ease-in-out" as const,
  },

  pulseSoft: {
    duration: 3000,
    type: "ease-in-out" as const,
  },

  shine: {
    duration: 3000,
    type: "infinite" as const,
  },
};
