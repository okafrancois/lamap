import { Colors } from './theme';

export const FocusStyles = {
  outline: {
    borderColor: Colors.light.ring,
    borderWidth: 2,
  },
  ring: {
    borderColor: Colors.light.ring,
    borderWidth: 3,
    opacity: 0.5,
  },
  offset: 2,
} as const;

