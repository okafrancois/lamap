import { Colors } from './theme';

export const FocusStyles = {
  outline: {
    borderColor: Colors.ring,
    borderWidth: 2,
  },
  ring: {
    borderColor: Colors.ring,
    borderWidth: 3,
    opacity: 0.5,
  },
  offset: 2,
} as const;

