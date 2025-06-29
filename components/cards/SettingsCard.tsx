import { FC, ReactNode } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { ProfileImage, ThemedText } from '@/components/common';

import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

// Reusable setting component
const SettingsCard: FC<{
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: ReactNode;
  danger?: boolean;
  profile?: boolean;
  userColor?: string;
}> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
  profile = false,
  userColor = '',
}) => {
  const colorScheme = useColorScheme();
  // Theme colors
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor, borderColor }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.settingLeftWrapper}>
        {profile ? (
          <ProfileImage
            size={responsiveScale(40)}
            backgroundColor={userColor}
            iconColor={userColor}
            containerStyle={{ marginRight: SPACING.md }}
          />
        ) : (
          <View
            style={[
              styles.iconContainer,

              {
                backgroundColor: danger
                  ? `${errorColor}20`
                  : colorScheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.2)',
              },
            ]}>
            {icon}
          </View>
        )}
        <View style={styles.settingTextWrapper}>
          <ThemedText
            style={[styles.settingTitleStyle, danger && { color: errorColor }]}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={styles.settingSubtitleStyle}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>
      {rightElement && (
        <View style={styles.settingRightWrapper}>{rightElement}</View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: responsiveScale(12),
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  settingLeftWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: responsiveScale(40),
    height: responsiveScale(40),
    borderRadius: responsiveScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingTextWrapper: {
    flex: 1,
  },
  settingTitleStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  settingSubtitleStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
    paddingTop: SPACING.xs,
  },
  settingRightWrapper: {
    paddingLeft: SPACING.md,
  },
});

export default SettingsCard;
