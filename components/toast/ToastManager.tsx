import {
  AlertTriangle,
  CheckCircle,
  Crown,
  Heart,
  Info,
  Target,
  Trophy,
  User,
  Users,
  XCircle,
} from 'lucide-react-native';
import React, { FC, ReactNode, useCallback, useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideInUp,
  SlideOutDown,
  SlideOutUp,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/Colors';
import { responsiveScale } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import Toast from './Toast';

type ToastMessage = {
  id: string;
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
  duration?: number;
  position?: 'bottom' | 'top';
  onClose?: () => void;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  textStyle?: StyleProp<TextStyle>;
  titleStyle?: StyleProp<TextStyle>;
  marginBottom?: number;
  marginTop?: number;
  fontFamily?: string;
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

type ToastMessageProps = Omit<ToastMessage, 'id'>;

// Global toast manager instance reference
let toastManagerInstance: {
  addToast: (toastProps: ToastMessageProps) => string;
  removeToast: (id: string) => void;
  closeAll: () => void;
} | null = null;

const ToastIcon: FC<{
  IconComponent: any;
  color?: string;
  size?: number;
  type?: string;
}> = ({
  IconComponent,
  color,
  size = responsiveScale(20),
  type = 'default',
}) => {
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const warningColor = useThemeColor({}, 'warning');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');

  // Apply custom color if provided
  if (color) {
    return <IconComponent size={size} color={color} strokeWidth={2.5} />;
  }

  // Default colors for different toast types
  const defaultColors = {
    success: COLORS.white,
    error: COLORS.white,
    warning: COLORS.white,
    info: COLORS.white,
    default: textColor,
  };

  const iconColor =
    defaultColors[type as keyof typeof defaultColors] || textColor;

  return <IconComponent size={size} color={iconColor} strokeWidth={2.5} />;
};

export const ToastManager: FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toastProps: ToastMessageProps): string => {
    // Generate unique ID for each toast
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = {
      id,
      position: 'top',
      type: 'default',
      duration: 4000,
      autoClose: true,
      enableHaptic: true,
      enableSwipeToClose: true,
      fontFamily: 'VietnamMedium',
      ...toastProps,
    };

    setToasts(prev => {
      // Limit toasts to prevent screen overflow
      const updated = [newToast, ...prev.slice(0, 3)];
      return updated;
    });

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Set up global toast manager instance
  toastManagerInstance = { addToast, removeToast, closeAll };

  // Organize toasts by their position
  const groupedToasts = toasts.reduce(
    (groups, toast) => {
      const position = toast.position || 'top';
      if (!groups[position]) groups[position] = [];
      groups[position].push(toast);
      return groups;
    },
    {} as Record<string, ToastMessage[]>,
  );

  const getAnimations = (position: string) => {
    switch (position) {
      case 'top':
        return { entering: SlideInUp, exiting: SlideOutUp };
      case 'bottom':
        return { entering: SlideInDown, exiting: SlideOutDown };
      default:
        return { entering: FadeIn, exiting: FadeOut };
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }]}>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => {
        const animations = getAnimations(position);

        return (
          <View
            key={position}
            style={styles.positionContainer}
            pointerEvents="box-none">
            {positionToasts.map((toast, index) => {
              // Stack toasts with proper spacing
              const verticalOffset = index * responsiveScale(75);

              return (
                <Animated.View
                  key={toast.id}
                  layout={LinearTransition.springify()
                    .damping(20)
                    .stiffness(200)}
                  entering={animations.entering
                    .springify()
                    .damping(20)
                    .stiffness(200)}
                  exiting={animations.exiting
                    .springify()
                    .damping(20)
                    .stiffness(200)}
                  style={[
                    styles.toastContainer,
                    {
                      top: position === 'top' ? verticalOffset : undefined,
                      bottom:
                        position === 'bottom' ? verticalOffset : undefined,
                      zIndex: 1000 - index,
                    },
                  ]}
                  pointerEvents="box-none">
                  <Toast
                    {...toast}
                    onClose={() => {
                      toast.onClose?.();
                      removeToast(toast.id);
                    }}
                  />
                </Animated.View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

// Show a general toast message
export const showToast = (props: ToastMessageProps): string => {
  if (!toastManagerInstance) {
    console.warn('ToastManager not mounted');
    return '';
  }
  return toastManagerInstance.addToast({
    position: 'top',
    ...props,
  });
};

// Show a success toast with a check icon
export const showSuccessToast = (
  message: string,
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    message,
    type: 'success',
    icon: () => <ToastIcon IconComponent={CheckCircle} type="success" />,
    duration: 3000,
    ...options,
  });
};

// Show a toast for game win
export const showGameWinToast = (
  message: string = 'You won!',
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    title: '🎉 Victory!',
    message,
    type: 'success',
    duration: 4000,
    position: 'top',
    icon: () => (
      <ToastIcon
        IconComponent={Trophy}
        color={COLORS.white}
        size={responsiveScale(24)}
      />
    ),
    ...options,
  });
};

// Show a toast for a tie game
export const showGameTieToast = (
  message: string = "It's a tie!",
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    title: '🤝 Tie Game!',
    message,
    type: 'warning',
    duration: 3000,
    position: 'top',
    icon: () => (
      <ToastIcon
        IconComponent={Users}
        color={COLORS.white}
        size={responsiveScale(24)}
      />
    ),
    ...options,
  });
};

// Show an error toast with X icon
export const showErrorToast = (
  message: string,
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    message,
    type: 'error',
    duration: 5000,
    icon: () => <ToastIcon IconComponent={XCircle} type="error" />,
    ...options,
  });
};

// Show a custom toast with specific background and text color
export const showCustomToast = (
  message: string,
  backgroundColor: string,
  textColor?: string,
): string => {
  return showToast({
    message,
    backgroundColor,
    textColor,
    duration: 3000,
    icon: () => (
      <ToastIcon IconComponent={Heart} color={textColor || COLORS.white} />
    ),
  });
};

// Show a warning toast with alert icon
export const showWarningToast = (
  message: string,
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    message,
    type: 'warning',
    duration: 4000,
    icon: () => <ToastIcon IconComponent={AlertTriangle} type="warning" />,
    ...options,
  });
};

// Show an info toast with info icon
export const showInfoToast = (
  message: string,
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    message,
    type: 'info',
    duration: 3000,
    icon: () => <ToastIcon IconComponent={Info} type="info" />,
    ...options,
  });
};

// Show achievement unlocked toast
export const showAchievementToast = (
  message: string,
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    title: 'Achievement Unlocked!',
    message,
    backgroundColor: COLORS.primary[500],
    textColor: COLORS.white,
    duration: 5000,
    position: 'top',
    icon: () => (
      <ToastIcon
        IconComponent={Crown}
        color={COLORS.warning[400]}
        size={responsiveScale(24)}
      />
    ),
    ...options,
  });
};

// Show profile updated toast with user icon
export const showProfileUpdatedToast = (
  message: string = 'Profile updated',
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    message,
    type: 'success',
    duration: 2000,
    icon: () => <ToastIcon IconComponent={User} type="success" />,
    ...options,
  });
};

// Show losing game toast with target icon
export const showGameLoseToast = (
  message: string = 'Better luck next time!',
  options?: Partial<ToastMessageProps>,
): string => {
  return showToast({
    title: 'Game Over',
    message,
    type: 'error',
    duration: 3000,
    position: 'top',
    icon: () => <ToastIcon IconComponent={Target} type="error" />,
    ...options,
  });
};

// Hide a specific toast by ID
export const hideToast = (id: string): void => {
  if (!toastManagerInstance) {
    console.warn('ToastManager not mounted');
    return;
  }
  toastManagerInstance.removeToast(id);
};

// Close all active toasts
export const closeAllToasts = (): void => {
  if (!toastManagerInstance) {
    console.warn('ToastManager not mounted');
    return;
  }
  toastManagerInstance.closeAll();
};

export default ToastManager;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  positionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
