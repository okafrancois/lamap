import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from './useSettings';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme = useRNColorScheme();
  const { themeMode } = useSettings();

  if (!hasHydrated) {
    return 'light';
  }

  if (themeMode === 'system') {
    return systemColorScheme ?? 'light';
  }

  return themeMode;
}
