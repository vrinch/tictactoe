import { COLORS } from '@/constants/Colors';
import { FONT_SIZES } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { FC } from 'react';
import { StyleSheet, type TextProps } from 'react-native';
import Animated from 'react-native-reanimated';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

const ThemedText: FC<ThemedTextProps> = ({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}) => {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Animated.Text
      style={[
        { color },
        type === 'default' ? styles.defaultTextStyle : undefined,
        type === 'title' ? styles.titleTextStyle : undefined,
        type === 'defaultSemiBold'
          ? styles.defaultSemiBoldTextStyle
          : undefined,
        type === 'subtitle' ? styles.subtitleTextStyle : undefined,
        type === 'link' ? styles.linkTextStyle : undefined,
        style,
      ]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  defaultTextStyle: {
    fontSize: FONT_SIZES.medium,
  },
  defaultSemiBoldTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  titleTextStyle: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: 'bold',
  },
  subtitleTextStyle: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
  },
  linkTextStyle: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.secondary[500],
  },
});

export default ThemedText;
