import { SCREEN_WIDTH } from '@/constants/config';
import { responsiveScale, SPACING } from '@/constants/theme';
import { getWinningCombinations } from '@/utils/gameLogic';
import { GameBoard as GameBoardType } from '@/utils/types';
import { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { GameCell } from '../buttons';

interface GameBoardProps {
  board: GameBoardType;
  onCellPress: (index: number) => void;
  disabled?: boolean;
  winner?: string | null;
  boardSize?: number;
}

const GameBoard: FC<GameBoardProps> = ({
  board,
  onCellPress,
  disabled = false,
  winner,
  boardSize = 3,
}) => {
  // Calculate responsive cell size based on screen width and board size
  const padding = SPACING.md * 2; // Left and right padding
  const cellMargin = responsiveScale(4); // Margin around each cell (2px on each side)
  const totalMargins = cellMargin * 2 * boardSize; // Total margin space
  const availableWidth = SCREEN_WIDTH - padding - totalMargins;
  const cellSize = Math.floor(availableWidth / boardSize);

  // Calculate total board width for centering
  const totalBoardWidth = cellSize * boardSize + totalMargins;

  // Get array of winning cell indices if there's a winner
  const getWinningCells = (): number[] => {
    if (!winner || winner === 'tie') return [];

    const winningCombinations = getWinningCombinations(boardSize);
    for (const combination of winningCombinations) {
      if (
        combination.length > 0 &&
        board[combination[0]] &&
        combination.every(
          (index: number) => board[index] === board[combination[0]],
        )
      ) {
        return combination;
      }
    }
    return [];
  };

  const winningCells = getWinningCells();

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      layout={LinearTransition}>
      <View style={[styles.boardWrapper, { width: totalBoardWidth }]}>
        {board.map((cell, index) => (
          <GameCell
            key={`${boardSize}-${index}`}
            value={cell}
            onPress={() => onCellPress(index)}
            disabled={disabled}
            isWinning={winningCells.includes(index)}
            cellSize={cellSize}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  boardWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GameBoard;
