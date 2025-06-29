import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from '@expo/vector-icons';
import { StatusBarStyle } from 'expo-status-bar';
import { FC, memo, ReactNode } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { ThemedText, ThemedView } from '@/components/common';
import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

type HeaderProps = {
  onPressBack?: VoidFunction;
  title?: string;
  disabled?: boolean;
  hideButton?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  color?: string;
  iconName?: string;
  iconFamily?: string;
  iconSize?: number;
  removeBarHeight?: boolean;
  hideStatusBar?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  centerComponent?: ReactNode;
  rightComponent?: ReactNode;
  leftComponent?: ReactNode;
  statusBarStyle?: StatusBarStyle;
};

// Header displays a customizable navigation bar at the top
const Header: FC<HeaderProps> = ({
  onPressBack,
  title,
  disabled,
  hideButton = false,
  style,
  textStyle,
  color,
  iconName = 'arrow-left',
  iconFamily = 'Feather',
  iconSize = responsiveScale(24),
  removeBarHeight = true,
  hideStatusBar = true,
  statusBarStyle,
  centerComponent,
  rightComponent,
  leftComponent,
  onLayout,
  ...headerProps
}) => {
  const textColor = useThemeColor({}, 'text');

  // Render the selected icon family for the back button
  const renderIcon = () => {
    switch (iconFamily) {
      case 'Ionicons':
        return (
          <Ionicons
            name={iconName}
            color={textColor || color}
            size={responsiveScale(iconSize)}
          />
        );
      case 'FontAwesome':
        return (
          <FontAwesome
            name={iconName}
            color={textColor || color}
            size={responsiveScale(iconSize)}
          />
        );
      case 'MaterialIcons':
        return (
          <MaterialIcons
            name={iconName}
            color={textColor || color}
            size={responsiveScale(iconSize)}
          />
        );
      default:
        return (
          <Feather
            name={iconName}
            color={textColor || color}
            size={responsiveScale(iconSize)}
          />
        );
    }
  };

  return (
    <ThemedView
      style={[styles.headerContainer, style]}
      removeBarHeight={removeBarHeight}
      hideStatusBar={hideStatusBar}
      statusBarStyle={statusBarStyle}
      onLayout={onLayout}
      {...headerProps}>
      {leftComponent ? (
        <View style={styles.sideContentWrapper}>{leftComponent}</View>
      ) : (
        <TouchableOpacity
          style={[styles.backButtonWrapper, styles.sideContentWrapper]}
          onPress={onPressBack}
          disabled={disabled || hideButton}>
          {!hideButton && renderIcon()}
        </TouchableOpacity>
      )}
      <View style={styles.centerContentWrapper}>
        {title !== '' && (
          <ThemedText style={[styles.titleTextStyle, textStyle]}>
            {title}
          </ThemedText>
        )}
        {centerComponent}
      </View>

      <View style={styles.sideContentWrapper}>{rightComponent}</View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.transparent,
  },
  backButtonWrapper: {
    borderRadius: responsiveScale(32.5),
  },
  centerContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideContentWrapper: {
    minWidth: responsiveScale(32.5),
    minHeight: responsiveScale(32.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleTextStyle: {
    fontSize: FONT_SIZES.large,
    paddingVertical: SPACING.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default memo(Header);
