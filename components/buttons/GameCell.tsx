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
  cellSize?: number;
}

const GameCell: FC<GameCellProps> = ({
  value,
  onPress,
  disabled = false,
  isWinning = false,
  cellSize = responsiveScale(100),
}) => {
  // Get theme colors for consistent styling
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const textColor = useThemeColor({}, 'text');

  // Calculate font size based on cell size (responsive)
  const fontSize = Math.max(Math.floor(cellSize * 0.4), 16); // Minimum 16, 40% of cell size
  const borderRadius = Math.max(Math.floor(cellSize * 0.08), 4); // Minimum 4, 8% of cell size

  // Get cell styling based on winning state
  const getCellStyle = () => {
    return [
      styles.cellContainer,
      {
        width: cellSize,
        height: cellSize,
        backgroundColor,
        borderColor: isWinning ? successColor : borderColor,
        borderWidth: isWinning ? 3 : 2,
        borderRadius: borderRadius,
        margin: 2,
      },
    ];
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
      <ThemedText
        adjustsFontSizeToFit
        style={[
          styles.cellTextStyle,
          {
            color: getTextColor(),
            fontSize: fontSize,
          },
        ]}>
        {value || ''}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cellContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellTextStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GameCell;
