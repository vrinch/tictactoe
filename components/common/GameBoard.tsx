import { WINNING_COMBINATIONS } from '@/constants/arrays';
import { responsiveScale } from '@/constants/theme';
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
}

const GameBoard: FC<GameBoardProps> = ({
  board,
  onCellPress,
  disabled = false,
  winner,
}) => {
  // Get array of winning cell indices if there's a winner
  const getWinningCells = (): number[] => {
    if (!winner || winner === 'tie') return [];

    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
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
      <View style={styles.boardWrapper}>
        {board.map((cell, index) => (
          <GameCell
            key={index}
            value={cell}
            onPress={() => onCellPress(index)}
            disabled={disabled}
            isWinning={winningCells.includes(index)}
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
  },
  boardWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: responsiveScale(312),
    justifyContent: 'center',
  },
});

export default GameBoard;
