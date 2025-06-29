import { FC } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ThemedText from './ThemedText';

import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

import { DELAY_LABELS, DELAYS } from '@/constants/arrays';
import { UserSettings } from '@/utils/types';

interface Props {
  userSettings: UserSettings;
  onPress: (delay: number) => void;
}
const DelaySelector: FC<Props> = ({ userSettings, onPress }) => {
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.container}>
      {DELAYS.map((delay, index) => (
        <TouchableOpacity
          key={delay}
          style={[
            styles.delayOptionWrapper,
            {
              backgroundColor:
                userSettings?.resetDelay === delay ? primaryColor : cardColor,
              borderColor:
                userSettings?.resetDelay === delay ? primaryColor : borderColor,
            },
          ]}
          onPress={() => onPress(delay)}>
          <ThemedText
            style={[
              styles.delayTextStyle,
              {
                color:
                  userSettings?.resetDelay === delay ? COLORS.white : textColor,
              },
            ]}>
            {DELAY_LABELS[index]}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  delayOptionWrapper: {
    flex: 0.2,
    padding: SPACING.sm,
    borderRadius: responsiveScale(6),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  delayTextStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
  bottomSpacingWrapper: {
    height: SPACING.xxl,
  },
});

export default DelaySelector;
