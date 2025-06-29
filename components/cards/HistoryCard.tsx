import { Clock, Handshake, Target, Trophy } from 'lucide-react-native';
import moment from 'moment-timezone';
import { FC } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/common';

import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { GameResult } from '@/utils/types';

interface ExtendedGameResult extends GameResult {
  boardState: string;
  gameDuration: number;
}

interface Props {
  result: ExtendedGameResult;
  index: number;
  onViewGame: (result: ExtendedGameResult) => void;
}

// Single game result component
const HistoryCard: FC<Props> = ({ result, index, onViewGame }) => {
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const warningColor = useThemeColor({}, 'warning');

  // Get color based on game result
  const getResultColor = () => {
    switch (result.result) {
      case 'win':
        return successColor;
      case 'lose':
        return errorColor;
      case 'tie':
        return warningColor;
      default:
        return textColor;
    }
  };

  // Get icon based on game result
  const getResultIcon = () => {
    switch (result.result) {
      case 'win':
        return <Trophy size={responsiveScale(16)} color={successColor} />;
      case 'lose':
        return <Target size={responsiveScale(16)} color={errorColor} />;
      case 'tie':
        return <Handshake size={responsiveScale(16)} color={warningColor} />;
      default:
        return null;
    }
  };

  // Format date string for display
  const formatDate = (dateString: string) => {
    return moment
      .tz(dateString, 'America/New_York')
      .format('MMM D, YYYY h:mm A');
  };

  // Format game duration into readable string
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Capitalize first letter of result
  const formatResult = (result: string) => {
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor, borderColor }]}
      onPress={() => onViewGame(result)}
      activeOpacity={0.7}>
      <View style={styles.resultHeaderWrapper}>
        <View style={styles.resultInfoWrapper}>
          <View style={styles.resultTitleWrapper}>
            {getResultIcon()}
            <ThemedText
              style={[styles.resultTextStyle, { color: getResultColor() }]}>
              {formatResult(result.result)}
            </ThemedText>
          </View>
          <ThemedText style={styles.resultUserStyle}>
            {result.username}
          </ThemedText>
        </View>

        <View style={styles.resultDetailsWrapper}>
          <ThemedText style={styles.resultDateStyle}>
            {formatDate(result.date)}
          </ThemedText>
          <ThemedText style={styles.resultMetaStyle}>
            {result.moves} moves • {result.difficulty}
          </ThemedText>
          {result.gameDuration > 0 && (
            <View style={styles.durationWrapper}>
              <Clock size={responsiveScale(12)} color={textColor} />
              <ThemedText style={styles.durationTextStyle}>
                {formatDuration(result.gameDuration)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: responsiveScale(12),
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.xs,
  },
  resultHeaderWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultInfoWrapper: {
    // flex: 1,
    paddingRight: SPACING.lg,
  },
  resultTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  resultTextStyle: {
    paddingLeft: SPACING.xs,
    fontSize: FONT_SIZES.medium,
    fontWeight: '700',
  },
  resultUserStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    opacity: 0.7,
  },
  resultDetailsWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  resultDateStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    opacity: 0.75,
    paddingBottom: SPACING.xs,
  },
  resultMetaStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.6,
    paddingBottom: SPACING.xs,
  },
  durationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  durationTextStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.6,
  },
  emptyStateWrapper: {
    alignItems: 'center',
    paddingTop: responsiveScale(60),
    paddingHorizontal: SPACING.lg,
  },
  emptyIconWrapper: {
    paddingBottom: SPACING.lg,
  },
  emptyTitleStyle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    paddingBottom: SPACING.sm,
  },
  emptyMessageStyle: {
    fontSize: FONT_SIZES.medium,
    textAlign: 'center',
    paddingBottom: SPACING.lg,
    opacity: 0.7,
  },
  startButtonWrapper: {
    width: '60%',
    alignSelf: 'center',
    paddingTop: SPACING.sm,
  },
});

export default HistoryCard;
