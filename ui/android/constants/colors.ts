/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#B71C1C'; // Dark Red
const tintColorDark = '#FFD700'; // Gold

export const Colors = {
  light: {
    text: '#FAFAFA', // Off-white for high contrast
    background: '#09090B', // Deep Zinc Black
    card: '#18181B', // Zinc 900
    tint: tintColorLight,
    icon: '#A1A1AA', // Zinc 400
    tabIconDefault: '#71717A',
    tabIconSelected: '#EF4444', // Vibrant Red
    primary: '#EF4444', // Vibrant Red
    secondary: '#3B82F6', // Vibrant Blue
    accent: '#FFD700', // Gold
    border: '#27272A', // Zinc 800
    inputBackground: '#27272A',
  },
  dark: {
    text: '#FAFAFA',
    background: '#09090B',
    card: '#18181B',
    tint: tintColorDark,
    icon: '#A1A1AA',
    tabIconDefault: '#71717A',
    tabIconSelected: '#EF4444',
    primary: '#EF4444',
    secondary: '#3B82F6',
    accent: '#FFD700',
    border: '#27272A',
    inputBackground: '#27272A',
  },
};
