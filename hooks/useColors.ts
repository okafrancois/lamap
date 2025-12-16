import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useColors() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  return Colors[theme];
}

