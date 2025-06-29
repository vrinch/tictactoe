import { COLORS } from '@/constants/Colors';
import { responsiveScale } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Player } from '@/utils/types';
import { FC } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common';

interface GameCellProps {
  value: Player;
  onPress: () => void;
  disabled?: boolean;
  isWinning?: boolean;
}

const GameCell: FC<GameCellProps> = ({
  value,
  onPress,
  disabled = false,
  isWinning = false,
}) => {
  // Get theme colors for consistent styling
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const textColor = useThemeColor({}, 'text');

  // Get cell styling based on winning state
  const getCellStyle = () => {
    let style = [
      styles.cellContainer,
      {
        backgroundColor,
        borderColor: isWinning ? successColor : borderColor,
      },
    ];

    if (isWinning) {
      style.push({ borderWidth: 3 });
    }

    return style;
  };

  // Get text color based on player value
  const getTextColor = () => {
    if (value === 'X') return successColor;
    if (value === 'O') return COLORS.primary[500];
    return textColor;
  };

  return (
    <TouchableOpacity
      style={getCellStyle()}
      onPress={onPress}
      disabled={disabled || value !== null}
      activeOpacity={0.7}>
      <ThemedText style={[styles.cellTextStyle, { color: getTextColor() }]}>
        {value || ''}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cellContainer: {
    width: responsiveScale(100),
    height: responsiveScale(100),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: responsiveScale(8),
    margin: responsiveScale(2),
  },
  cellTextStyle: {
    fontSize: responsiveScale(36),
    fontWeight: 'bold',
  },
});

export default GameCell;
