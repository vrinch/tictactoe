import * as Haptics from 'expo-haptics';
import { FC, ReactNode, memo, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, SPACING, responsiveScale } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { shallowEqual, useSelector } from 'react-redux';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';
export type ButtonSize = 'small' | 'medium' | 'large' | 'xl';

interface ButtonProps {
  title?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  height?: number | null;
  width?: string | number | null;
  borderRadius?: number;
  backgroundColor?: string;
  buttonTextColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: TextStyle['fontWeight'];
  paddingHorizontal?: number;
  paddingVertical?: number;
  marginVertical?: number;
  marginHorizontal?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  enableAnimation?: boolean;
  enableHaptic?: boolean;
  enableRipple?: boolean;
  activeOpacity?: number;
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  delayPressIn?: number;
  delayPressOut?: number;
  loadingText?: string;
  loadingColor?: string;
}

const Button: FC<ButtonProps> = ({
  title,
  isLoading = false,
  disabled = false,
  onPress,
  style,
  buttonStyle,
  textStyle,
  height,
  width = '100%',
  borderRadius,
  backgroundColor,
  buttonTextColor,
  borderColor,
  fontSize,
  fontFamily = 'System',
  fontWeight = '600',
  paddingHorizontal,
  paddingVertical,
  marginVertical = 0,
  marginHorizontal = 0,
  variant = 'primary',
  size = 'medium',
  enableAnimation = true,
  enableHaptic = true,
  enableRipple = true,
  activeOpacity = 0.8,
  children,
  leftIcon,
  rightIcon,
  onPressIn,
  onPressOut,
  onLongPress,
  delayPressIn = 0,
  delayPressOut = 100,
  loadingText,
  loadingColor,
}) => {
  const { userSettings } = useSelector(
    (state: any) => ({
      userSettings: state.user.userSettings,
    }),
    shallowEqual,
  );

  // Get theme colors for consistent styling
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderThemeColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');

  // Shared values for animations
  const scale = useSharedValue(1);
  const ripple = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Get button size configuration based on size prop
  const getSizeConfig = useCallback(() => {
    switch (size) {
      case 'small':
        return {
          height: height ?? responsiveScale(36),
          paddingHorizontal: paddingHorizontal ?? SPACING.md,
          paddingVertical: paddingVertical ?? SPACING.sm,
          fontSize: fontSize ?? FONT_SIZES.small,
          borderRadius: borderRadius ?? responsiveScale(8),
        };
      case 'medium':
        return {
          height: height ?? responsiveScale(48),
          paddingHorizontal: paddingHorizontal ?? SPACING.lg,
          paddingVertical: paddingVertical ?? SPACING.md,
          fontSize: fontSize ?? FONT_SIZES.medium,
          borderRadius: borderRadius ?? responsiveScale(12),
        };
      case 'large':
        return {
          height: height ?? responsiveScale(56),
          paddingHorizontal: paddingHorizontal ?? SPACING.xl,
          paddingVertical: paddingVertical ?? SPACING.lg,
          fontSize: fontSize ?? FONT_SIZES.large,
          borderRadius: borderRadius ?? responsiveScale(14),
        };
      case 'xl':
        return {
          height: height ?? responsiveScale(64),
          paddingHorizontal: paddingHorizontal ?? SPACING.xxl,
          paddingVertical: paddingVertical ?? SPACING.xl,
          fontSize: fontSize ?? FONT_SIZES.xlarge,
          borderRadius: borderRadius ?? responsiveScale(16),
        };
      default:
        return {
          height: height ?? responsiveScale(48),
          paddingHorizontal: paddingHorizontal ?? SPACING.lg,
          paddingVertical: paddingVertical ?? SPACING.md,
          fontSize: fontSize ?? FONT_SIZES.medium,
          borderRadius: borderRadius ?? responsiveScale(12),
        };
    }
  }, [
    size,
    height,
    paddingHorizontal,
    paddingVertical,
    fontSize,
    borderRadius,
  ]);

  // Get button variant styles with theme colors
  const getVariantStyles = useCallback(() => {
    const isDisabled = disabled || isLoading;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor:
            backgroundColor ??
            (isDisabled ? COLORS.neutral[400] : primaryColor),
          borderColor:
            backgroundColor ??
            (isDisabled ? COLORS.neutral[400] : primaryColor),
          borderWidth: 0,
          textColor: buttonTextColor ?? COLORS.white,
        };

      case 'secondary':
        return {
          backgroundColor:
            backgroundColor ??
            (isDisabled ? COLORS.neutral[100] : secondaryColor),
          borderColor:
            borderColor ??
            (isDisabled ? COLORS.neutral[300] : borderThemeColor),
          borderWidth: 1,
          textColor:
            buttonTextColor ?? (isDisabled ? COLORS.neutral[400] : textColor),
        };

      case 'outline':
        return {
          backgroundColor: backgroundColor ?? COLORS.transparent,
          borderColor:
            borderColor ?? (isDisabled ? COLORS.neutral[300] : primaryColor),
          borderWidth: 2,
          textColor:
            buttonTextColor ??
            (isDisabled ? COLORS.neutral[400] : primaryColor),
        };

      case 'ghost':
        return {
          backgroundColor: backgroundColor ?? COLORS.transparent,
          borderColor: COLORS.transparent,
          borderWidth: 0,
          textColor:
            buttonTextColor ??
            (isDisabled ? COLORS.neutral[400] : primaryColor),
        };

      case 'danger':
        return {
          backgroundColor:
            backgroundColor ?? (isDisabled ? COLORS.error[200] : errorColor),
          borderColor:
            backgroundColor ?? (isDisabled ? COLORS.error[200] : errorColor),
          borderWidth: 0,
          textColor: buttonTextColor ?? COLORS.white,
        };

      case 'success':
        return {
          backgroundColor:
            backgroundColor ??
            (isDisabled ? COLORS.success[200] : successColor),
          borderColor:
            backgroundColor ??
            (isDisabled ? COLORS.success[200] : successColor),
          borderWidth: 0,
          textColor: buttonTextColor ?? COLORS.white,
        };

      default:
        return {
          backgroundColor: backgroundColor ?? primaryColor,
          borderColor: backgroundColor ?? primaryColor,
          borderWidth: 0,
          textColor: buttonTextColor ?? COLORS.white,
        };
    }
  }, [
    variant,
    disabled,
    isLoading,
    backgroundColor,
    buttonTextColor,
    borderColor,
    primaryColor,
    secondaryColor,
    textColor,
    borderThemeColor,
    errorColor,
    successColor,
  ]);

  const sizeConfig = getSizeConfig();
  const variantStyles = getVariantStyles();

  // Animated styles with scale and opacity
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Ripple effect animation style
  const rippleStyle = useAnimatedStyle(() => {
    if (!enableRipple) return {};

    return {
      backgroundColor: interpolateColor(
        ripple.value,
        [0, 1],
        [COLORS.transparent, 'rgba(255, 255, 255, 0.2)'],
      ),
      transform: [{ scale: ripple.value }],
    };
  });

  // Handle press in with animations and haptic feedback
  const handlePressIn = useCallback(() => {
    if (enableAnimation && !disabled && !isLoading) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      if (enableRipple) {
        ripple.value = withTiming(1, { duration: 150 });
      }
    }

    if (
      enableHaptic &&
      userSettings?.hapticEnabled &&
      !disabled &&
      !isLoading
    ) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }

    onPressIn?.();
  }, [
    enableAnimation,
    enableRipple,
    enableHaptic,
    disabled,
    isLoading,
    onPressIn,
    userSettings?.hapticEnabled,
  ]);

  // Handle press out with animations
  const handlePressOut = useCallback(() => {
    if (enableAnimation) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (enableRipple) {
        ripple.value = withTiming(0, { duration: 200 });
      }
    }

    onPressOut?.();
  }, [enableAnimation, enableRipple, onPressOut]);

  // Handle main press action
  const handlePress = useCallback(() => {
    if (!disabled && !isLoading) {
      onPress?.();
    }
  }, [disabled, isLoading, onPress]);

  // Handle long press with haptic feedback
  const handleLongPress = useCallback(() => {
    if (!disabled && !isLoading && onLongPress) {
      if (enableHaptic && userSettings?.hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onLongPress();
    }
  }, [
    disabled,
    isLoading,
    onLongPress,
    enableHaptic,
    userSettings?.hapticEnabled,
  ]);

  // Render button content with loading state
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContentWrapper}>
          <ActivityIndicator
            size="small"
            color={loadingColor ?? variantStyles.textColor}
          />
          {loadingText && (
            <Text
              style={[
                styles.loadingTextStyle,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeConfig.fontSize,
                  fontFamily,
                  fontWeight,
                  paddingLeft: SPACING.sm,
                },
              ]}>
              {loadingText}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.contentWrapper}>
        {leftIcon && (
          <View style={[styles.iconContainer, styles.leftIconStyle]}>
            {leftIcon}
          </View>
        )}

        {title && (
          <Text
            style={[
              styles.buttonTextStyle,
              {
                color: variantStyles.textColor,
                fontSize: sizeConfig.fontSize,
                fontFamily,
                fontWeight,
              },
              textStyle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            allowFontScaling={false}>
            {title}
          </Text>
        )}

        {children}

        {rightIcon && (
          <View style={[styles.iconContainer, styles.rightIconStyle]}>
            {rightIcon}
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        {
          width,
          marginVertical,
          marginHorizontal,
        },
        style,
      ]}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled || isLoading}
        delayPressIn={delayPressIn}
        delayPressOut={delayPressOut}>
        <Animated.View
          style={[
            styles.buttonContainer,
            animatedStyle,
            {
              height: sizeConfig.height,
              borderRadius: sizeConfig.borderRadius,
              backgroundColor: variantStyles.backgroundColor,
              borderColor: variantStyles.borderColor,
              borderWidth: variantStyles.borderWidth,
              paddingHorizontal: sizeConfig.paddingHorizontal,
              paddingVertical: sizeConfig.paddingVertical,
            },
            buttonStyle,
          ]}>
          {enableRipple && (
            <Animated.View style={[styles.rippleOverlay, rippleStyle]} />
          )}

          {renderContent()}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonTextStyle: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIconStyle: {
    paddingRight: SPACING.sm,
  },
  rightIconStyle: {
    paddingLeft: SPACING.sm,
  },
  loadingContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingTextStyle: {
    includeFontPadding: false,
  },
  rippleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
});

export default memo(Button);
