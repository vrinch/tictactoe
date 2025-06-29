import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { FC, ReactNode, useCallback, useEffect } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/Colors';
import { DEFAULT_DURATION, SCREEN_HEIGHT } from '@/constants/config';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { shallowEqual, useSelector } from 'react-redux';

const ANIMATION_DURATION = 400;

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

type ToastProps = {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
  position?: 'bottom' | 'top';
  onClose?: () => void;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  textStyle?: StyleProp<TextStyle>;
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  fontFamily?: string;
  marginBottom?: number;
  marginTop?: number;
  left?: number;
  right?: number;
  borderRadius?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  zIndex?: number;
  autoClose?: boolean;
  disabled?: boolean;
  triggerClose?: boolean;
  showCloseButton?: boolean;
  enableHaptic?: boolean;
  enableSwipeToClose?: boolean;
  icon?: ReactNode | (() => ReactNode);
  action?: {
    label: string;
    onPress: () => void;
  };
};

const Toast: FC<ToastProps> = ({
  message,
  title,
  type = 'default',
  duration = DEFAULT_DURATION + 1000,
  onClose,
  position = 'top',
  fontSize = responsiveScale(14),
  textColor,
  backgroundColor,
  textStyle,
  titleStyle,
  style,
  fontFamily = 'VietnamMedium',
  marginBottom,
  marginTop,
  left = responsiveScale(16),
  right = responsiveScale(16),
  borderRadius = responsiveScale(12),
  paddingHorizontal = responsiveScale(16),
  paddingVertical = responsiveScale(12),
  zIndex = 1000,
  autoClose = true,
  disabled = false,
  showCloseButton = false,
  triggerClose = false,
  enableHaptic = true,
  enableSwipeToClose = true,
  icon,
  action,
}) => {
  const { userSettings } = useSelector(
    (state: any) => ({
      userSettings: state.user.userSettings,
    }),
    shallowEqual,
  );

  // Get theme colors for toast styling
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const warningColor = useThemeColor({}, 'warning');
  const cardColor = useThemeColor({}, 'card');
  const textThemeColor = useThemeColor({}, 'text');

  // Get colors based on toast type with custom color support
  const getTypeColors = useCallback(() => {
    if (backgroundColor || textColor) {
      return {
        background: backgroundColor || cardColor,
        text: textColor || textThemeColor,
      };
    }

    switch (type) {
      case 'success':
        return {
          background: successColor,
          text: COLORS.white,
        };
      case 'error':
        return {
          background: errorColor,
          text: COLORS.white,
        };
      case 'warning':
        return {
          background: warningColor,
          text: COLORS.white,
        };
      case 'info':
        return {
          background: primaryColor,
          text: COLORS.white,
        };
      default:
        return {
          background: cardColor,
          text: textThemeColor,
        };
    }
  }, [
    type,
    backgroundColor,
    textColor,
    successColor,
    errorColor,
    warningColor,
    primaryColor,
    cardColor,
    textThemeColor,
  ]);

  const colors = getTypeColors();

  // Calculate animation positions based on screen position
  const INITIAL_POSITION =
    position === 'bottom' ? SCREEN_HEIGHT : -SCREEN_HEIGHT;
  const FINAL_POSITION =
    position === 'bottom'
      ? -(marginBottom || Constants.statusBarHeight + SPACING.lg)
      : marginTop || SPACING.sm;

  // Shared values for animations
  const translateY = useSharedValue(INITIAL_POSITION);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Smooth slide out animation
  const slideOut = useCallback(() => {
    'worklet';
    translateY.value = withTiming(INITIAL_POSITION, {
      duration: ANIMATION_DURATION,
    });
    opacity.value = withTiming(0, {
      duration: ANIMATION_DURATION / 2,
    });
    scale.value = withTiming(
      0.9,
      {
        duration: ANIMATION_DURATION,
      },
      () => {
        runOnJS(onClose || (() => {}))();
      },
    );
  }, [onClose, INITIAL_POSITION]);

  // Pan gesture handler for swipe to dismiss
  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        if (enableHaptic && userSettings?.hapticEnabled) {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        }
      },

      onActive: event => {
        if (!enableSwipeToClose) return;

        if (position === 'bottom') {
          translateY.value = Math.max(
            FINAL_POSITION - event.translationY,
            FINAL_POSITION,
          );
        } else {
          translateY.value = Math.min(
            FINAL_POSITION + event.translationY,
            FINAL_POSITION,
          );
        }

        const swipeProgress = Math.abs(event.translationY) / 100;
        opacity.value = Math.max(1 - swipeProgress * 0.5, 0.5);
      },

      onEnd: event => {
        if (!enableSwipeToClose) return;

        const swipeThreshold = 60;
        const shouldClose =
          Math.abs(event.translationY) > swipeThreshold ||
          Math.abs(event.velocityY) > 600;

        if (shouldClose) {
          slideOut();
        } else {
          translateY.value = withSpring(FINAL_POSITION, {
            damping: 20,
            stiffness: 200,
          });
          opacity.value = withSpring(1, {
            damping: 20,
            stiffness: 200,
          });
        }
      },
    });

  // Handle toast entrance animation and auto close
  useEffect(() => {
    if (enableHaptic && userSettings?.hapticEnabled) {
      const hapticType =
        type === 'error'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(hapticType);
    }

    translateY.value = withSpring(FINAL_POSITION, {
      damping: 25,
      stiffness: 180,
    });

    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION,
    });

    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 200,
    });

    if (autoClose || triggerClose) {
      const timeout = setTimeout(() => {
        slideOut();
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [
    duration,
    autoClose,
    triggerClose,
    enableHaptic,
    type,
    FINAL_POSITION,
    slideOut,
    userSettings?.hapticEnabled,
  ]);

  // Animated styles for toast container
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  // Render action button if provided
  const renderAction = () => {
    if (!action) return null;

    return (
      <TouchableOpacity
        style={[
          styles.actionButtonContainer,
          { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
        ]}
        onPress={() => {
          action.onPress();
          slideOut();
        }}
        activeOpacity={0.7}>
        <Text
          style={[
            styles.actionButtonTextStyle,
            { color: colors.text, fontFamily },
          ]}>
          {action.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render close button if enabled
  const renderCloseButton = () => {
    if (!autoClose && showCloseButton) {
      return (
        <TouchableOpacity
          style={[
            styles.closeButtonContainer,
            { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
          ]}
          onPress={() => slideOut()}
          disabled={disabled}
          activeOpacity={0.7}>
          <Text style={[styles.closeButtonTextStyle, { color: colors.text }]}>
            ✕
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          styles.toastContainer,
          {
            backgroundColor: colors.background,
            borderRadius,
            paddingHorizontal,
            paddingVertical,
            zIndex,
            left,
            right,
            marginBottom:
              position === 'bottom'
                ? marginBottom || Constants.statusBarHeight
                : marginBottom || 0,
            marginTop:
              position === 'top'
                ? marginTop || Constants.statusBarHeight
                : marginTop || 0,
          },
          animatedStyle,
          style,
        ]}>
        {icon && (
          <Animated.View style={styles.iconWrapper}>
            {typeof icon === 'function' ? icon() : icon}
          </Animated.View>
        )}

        <Animated.View style={styles.textContentWrapper}>
          {title && (
            <Text
              style={[
                styles.titleTextStyle,
                {
                  color: colors.text,
                  fontFamily: fontFamily,
                  fontSize: fontSize + 2,
                },
                titleStyle,
              ]}>
              {title}
            </Text>
          )}

          <Text
            style={[
              styles.messageTextStyle,
              {
                color: colors.text,
                fontSize,
                fontFamily,
              },
              textStyle,
            ]}>
            {message}
          </Text>
        </Animated.View>

        <Animated.View style={styles.actionsWrapper}>
          {renderAction()}
          {renderCloseButton()}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: responsiveScale(56),
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  iconWrapper: {
    paddingRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleTextStyle: {
    fontWeight: '600',
    paddingBottom: SPACING.xs,
    includeFontPadding: false,
  },
  messageTextStyle: {
    includeFontPadding: false,
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.sm,
  },
  actionButtonContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: responsiveScale(8),
    paddingRight: SPACING.sm,
  },
  actionButtonTextStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
  closeButtonContainer: {
    width: responsiveScale(28),
    height: responsiveScale(28),
    borderRadius: responsiveScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonTextStyle: {
    fontSize: responsiveScale(14),
    fontWeight: 'bold',
  },
});

export default Toast;
