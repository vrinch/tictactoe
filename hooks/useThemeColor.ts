import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

// Returns the right color for current theme (light/dark mode)
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  // Use custom color from props if provided, otherwise use theme default
  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
