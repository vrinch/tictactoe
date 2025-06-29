import { responsiveScale } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { FC, ReactNode, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface PaginationProps extends TouchableOpacityProps {
  activeSlide?: boolean;
  type?: 'circle' | 'rectangle';
  size?: number;
  disabled?: boolean;
  marginHorizontal?: number;
  children?: ReactNode;
}

const Pagination: FC<PaginationProps> = ({
  activeSlide = false,
  type = 'circle',
  size = responsiveScale(8),
  disabled = false,
  marginHorizontal = responsiveScale(4),
  children,
  ...props
}) => {
  // Use theme colors
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');

  // Animated values for transitions
  const scale = useSharedValue(activeSlide ? 1.2 : 1);
  const colorProgress = useSharedValue(activeSlide ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(activeSlide ? 1.2 : 1, {
      damping: 15,
      stiffness: 150,
    });
    colorProgress.value = withTiming(activeSlide ? 1 : 0, {
      duration: 200,
    });
  }, [activeSlide]);

  // Animated style with color interpolation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(
        colorProgress.value,
        [0, 1],
        [borderColor, primaryColor],
      ),
    };
  });

  // Container styles following existing patterns
  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    marginHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <TouchableOpacity
        disabled={disabled}
        style={styles.buttonStyle}
        {...props}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonStyle: {
    width: '100%',
    height: '100%',
  },
});

export default Pagination;
