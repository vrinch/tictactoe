import Constants from 'expo-constants';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import { FC, ReactNode } from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';
import Animated from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  hideStatusBar?: boolean;
  paddingTop?: number;
  removeBarHeight?: boolean;
  statusBarStyle?: StatusBarStyle;
  statusBarBackgroundColor?: string;
  children?: ReactNode;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const ThemedView: FC<ThemedViewProps> = ({
  lightColor,
  darkColor,
  paddingTop = 0,
  removeBarHeight = false,
  style,
  children,
  hideStatusBar = false,
  statusBarStyle = '',
  statusBarBackgroundColor,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );
  const statusBarHeight = Constants.statusBarHeight || 20;

  // Determine the actual status bar background color
  const actualStatusBarBgColor = statusBarBackgroundColor || backgroundColor;

  return (
    <AnimatedView
      style={[
        {
          backgroundColor,
          paddingTop: removeBarHeight ? paddingTop : statusBarHeight,
        },
        style,
      ]}
      {...props}>
      {/* Status bar background view - positioned behind the status bar */}
      {!hideStatusBar && !removeBarHeight && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: statusBarHeight,
            backgroundColor: actualStatusBarBgColor,
            zIndex: -1,
          }}
        />
      )}

      {!hideStatusBar && (
        <StatusBar
          translucent
          style={statusBarStyle || (colorScheme === 'dark' ? 'light' : 'dark')}
        />
      )}

      {children}
    </AnimatedView>
  );
};

export default ThemedView;
