import * as Haptics from 'expo-haptics';

type SoundType = 'cardPlay' | 'victory' | 'kora' | 'defeat';

export function useSound() {
  const playSound = async (type: SoundType) => {
    try {
      switch (type) {
        case 'cardPlay':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'victory':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'kora':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'defeat':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.warn(`Failed to play haptic ${type}:`, error);
    }
  };

  return { playSound };
}

