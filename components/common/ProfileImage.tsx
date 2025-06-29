import { Image, ImageStyle } from 'expo-image';
import React, {
  FC,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { responsiveScale } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { lightenHex } from '@/utils/general';
import { User } from '../svgicons';

interface ProfileImageProps {
  uri?: string;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  size?: number;
  contentFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  children?: ReactNode;
  icon?: ReactNode;
  iconStyle?: StyleProp<ViewStyle>;
  iconColor?: string;
  backgroundColor?: string;
}

const ProfileImage: FC<ProfileImageProps> = ({
  uri,
  containerStyle,
  imageStyle,
  size = responsiveScale(40),
  contentFit = 'cover',
  children,
  icon,
  iconStyle,
  iconColor,
  backgroundColor,
}) => {
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const isMounted = useRef(true);

  // Use theme colors
  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLoad = useCallback(() => {
    if (isMounted.current) {
      setIsLoadingImage(false);
      setHasError(false);
    }
  }, []);

  const handleError = useCallback((error: any) => {
    if (isMounted.current) {
      setIsLoadingImage(false);
      setHasError(true);
    }
  }, []);

  const containerStyles = useMemo(
    () => [
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: backgroundColor
          ? lightenHex(backgroundColor)
          : cardColor,
        borderWidth: 1,
        borderColor: borderColor,
      },
      containerStyle,
    ],
    [size, cardColor, borderColor, containerStyle, backgroundColor],
  );

  const computedImageStyle = useMemo(
    () => [
      {
        width: size - 2, // Account for border
        height: size - 2,
        borderRadius: (size - 2) / 2,
        position: 'absolute' as const,
        top: 1,
        left: 1,
        opacity: isLoadingImage || hasError ? 0 : 1,
      },
      imageStyle,
    ],
    [size, isLoadingImage, hasError, imageStyle],
  );

  return (
    <Animated.View
      layout={LinearTransition}
      style={[styles.container, containerStyles]}>
      {uri && !hasError ? (
        <Image
          contentFit={contentFit}
          source={{ uri }}
          style={computedImageStyle}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}

      {icon && (isLoadingImage || hasError || !uri) ? (
        <View style={[styles.iconContainer, iconStyle]}>{icon}</View>
      ) : (
        (isLoadingImage || hasError || !uri) && (
          <User
            size={responsiveScale(size * 0.8)}
            color={iconColor || textColor}
            style={{ top: size / 4.5 }}
          />
        )
      )}
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(ProfileImage);
