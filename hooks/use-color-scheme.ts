import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from './useSettings';

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const { themeMode, isLoading } = useSettings();

  // While loading, use system preference
  if (isLoading || themeMode === 'system') {
    return systemColorScheme ?? 'light';
  }

  return themeMode;
}
