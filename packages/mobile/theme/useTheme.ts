// useTheme.ts

// Information: useTheme.ts hook that just returns the theme object from theme.ts
//              It is very short and simple right now, but it should give us a
//              clean and consistent way for components to access theme values.

import { theme } from './theme';

export const useTheme = () => {
  return theme;
};
