import { router } from 'expo-router';
import { History, LogOut, RotateCcw, Settings } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { GameButton } from '@/components/buttons';
import {
  GameBoard,
  RollingNumber,
  ThemedText,
  ThemedView,
} from '@/components/common';

import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

import { Header } from '@/components/headers';
import {
  showErrorToast,
  showGameLoseToast,
  showGameTieToast,
  showGameWinToast,
  showSuccessToast,
} from '@/components/toast';
import { useGameSound } from '@/hooks/useGameSound';
import { getUserDetails } from '@/redux/actions';
import {
  checkWinner,
  createEmptyBoard,
  getAIMove,
  makeMove,
  serializeBoardState,
} from '@/utils/gameLogic';
import {
  getCurrentUser,
  logoutUser,
  saveGameResult,
  saveOrUpdateUserProfile,
  updateUserStats,
} from '@/utils/storage';
import { Difficulty, GameState } from '@/utils/types';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

export default function GameScreen() {
  const dispatch = useDispatch();

  const { userDetails, userSettings } = useSelector(
    (state: any) => ({
      userDetails: state.user.userDetails,
      userSettings: state.user.userSettings,
    }),
    shallowEqual,
  );

  // Game state management
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: userSettings?.aiPlaysFirst ? 'O' : 'X',
    winner: null,
    gameOver: false,
    playerScore: 0,
    aiScore: 0,
    ties: 0,
  });

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [moveCount, setMoveCount] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [gameMoves, setGameMoves] = useState<
    { player: 'X' | 'O'; position: number }[]
  >([]);

  // Timer and settings tracking
  const autoResetTimer = useRef<NodeJS.Timeout | null>(null);
  const prevAIPlaysFirst = useRef<boolean>(userSettings?.aiPlaysFirst || false);

  const { playClick, playWin, playLose, stopAllSounds } = useGameSound();

  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');

  // Load user profile and settings on mount
  useEffect(() => {
    loadUserData();
  }, [userDetails]);

  // Reset game when aiPlaysFirst setting changes from false to true
  useEffect(() => {
    if (userSettings?.aiPlaysFirst && !prevAIPlaysFirst.current) {
      handleNewGame();
    }
    prevAIPlaysFirst.current = userSettings?.aiPlaysFirst || false;
  }, [userSettings?.aiPlaysFirst]);

  // Handle AI turn after player move
  useEffect(() => {
    if (
      gameState.currentPlayer === 'O' &&
      !gameState.gameOver &&
      (gameState.board.some(cell => cell !== null) || moveCount === 0)
    ) {
      const timer = setTimeout(() => {
        handleAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.gameOver, moveCount, gameState.board]);

  // Auto-reset game after completion
  useEffect(() => {
    if (gameState.gameOver && userSettings?.autoResetBoard) {
      autoResetTimer.current = setTimeout(() => {
        handleNewGame();
      }, userSettings?.resetDelay || 3000);

      return () => {
        if (autoResetTimer.current) {
          clearTimeout(autoResetTimer.current);
        }
      };
    }
  }, [
    gameState.gameOver,
    userSettings?.autoResetBoard,
    userSettings?.resetDelay,
  ]);

  // Load user profile and settings
  const loadUserData = async (): Promise<void> => {
    try {
      if (!userDetails) {
        router.replace('/walkthrough');
        return;
      }

      // Update game state with user's current stats
      setGameState(prev => ({
        ...prev,
        playerScore: userDetails?.wins || 0,
        aiScore: userDetails?.losses || 0,
        ties: userDetails?.ties || 0,
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/walkthrough');
    }
  };

  // Handle player move with sound and tracking
  const handleCellPress = async (index: number): Promise<void> => {
    if (
      gameState.gameOver ||
      gameState.board[index] !== null ||
      gameState.currentPlayer !== 'X'
    ) {
      return;
    }

    // Play click sound if enabled
    if (userSettings?.soundEnabled) {
      try {
        await playClick();
      } catch (error) {
        console.error('Error playing click sound:', error);
      }
    }

    const newBoard = makeMove(gameState.board, index, 'X');
    const winner = checkWinner(newBoard);
    const newMoveCount = moveCount + 1;
    const newMoves = [...gameMoves, { player: 'X', position: index }];

    setMoveCount(newMoveCount);
    setGameMoves(newMoves);
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: winner ? 'X' : 'O',
      winner,
      gameOver: winner !== null,
    }));

    if (winner) {
      await handleGameEnd(winner, newMoveCount, newMoves, newBoard);
    }
  };

  // Handle AI move with tracking
  const handleAIMove = async (): Promise<void> => {
    const aiMoveIndex = getAIMove(gameState.board, difficulty);
    if (aiMoveIndex === -1) return;

    const newBoard = makeMove(gameState.board, aiMoveIndex, 'O');
    const winner = checkWinner(newBoard);
    const newMoveCount = moveCount + 1;
    const newMoves = [...gameMoves, { player: 'O', position: aiMoveIndex }];

    setMoveCount(newMoveCount);
    setGameMoves(newMoves);
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: winner ? 'O' : 'X',
      winner,
      gameOver: winner !== null,
    }));

    if (winner) {
      await handleGameEnd(winner, newMoveCount, newMoves, newBoard);
    }
  };

  // Handle game completion with sounds, stats, and storage
  const handleGameEnd = async (
    winner: string,
    moves: number,
    gameMoves: { player: 'X' | 'O'; position: number }[],
    finalBoard: ('X' | 'O' | null)[],
  ): Promise<void> => {
    if (!userDetails) return;

    let result: 'win' | 'lose' | 'tie';

    // Determine result and update local score
    if (winner === 'tie') {
      result = 'tie';
      setGameState(prev => ({ ...prev, ties: prev.ties + 1 }));
      showGameTieToast("It's a tie!", { type: 'warning' });
    } else if (winner === 'X') {
      result = 'win';
      setGameState(prev => ({ ...prev, playerScore: prev.playerScore + 1 }));
      showGameWinToast('You won! 🎉');
    } else {
      result = 'lose';
      setGameState(prev => ({ ...prev, aiScore: prev.aiScore + 1 }));
      showGameLoseToast('AI wins this time!');
    }

    // Play sound immediately after determining result
    if (userSettings?.soundEnabled) {
      try {
        if (winner === 'X') {
          playWin();
        } else if (winner === 'O') {
          playLose();
        }
      } catch (error) {
        console.error('Error playing game end sound:', error);
      }
    }

    // Save game data separately
    try {
      const gameDuration = Date.now() - gameStartTime;
      const boardState = serializeBoardState(finalBoard, gameMoves);

      const gameResult = {
        id: Date.now().toString(),
        userId: userDetails?.userId,
        username: userDetails?.username,
        result,
        date: new Date().toISOString(),
        moves,
        difficulty,
        boardState,
        gameDuration,
      };

      await saveGameResult(gameResult);
      await updateUserStats(userDetails?.userId, result);

      // Refresh user profile with updated stats
      const updatedProfile = await getCurrentUser();
      if (updatedProfile) {
        dispatch(getUserDetails(updatedProfile));
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  // Start new game
  const handleNewGame = (): void => {
    if (autoResetTimer.current) {
      clearTimeout(autoResetTimer.current);
    }

    const newBoard = createEmptyBoard();
    const initialPlayer = userSettings?.aiPlaysFirst ? 'O' : 'X';

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: initialPlayer,
      winner: null,
      gameOver: false,
    }));
    setMoveCount(0);
    setGameStartTime(Date.now());
    setGameMoves([]);
  };

  // Reset all scores with confirmation and persist to database
  const resetAllScores = async (): Promise<void> => {
    Alert.alert(
      'Reset All Scores?',
      'This will reset your win/loss record. Your game history will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userDetails) return;

              // Create updated profile with reset stats
              const resetProfile = {
                ...userDetails,
                wins: 0,
                losses: 0,
                ties: 0,
                gamesPlayed: 0,
              };

              // Save the reset profile to database
              await saveOrUpdateUserProfile(resetProfile);

              // Update Redux with reset stats
              dispatch(getUserDetails(resetProfile));

              // Reset local game state
              setGameState(prev => ({
                ...prev,
                playerScore: 0,
                aiScore: 0,
                ties: 0,
              }));

              showSuccessToast('Scores reset successfully');
            } catch (error) {
              console.error('Error resetting scores:', error);
              showErrorToast('Failed to reset scores');
            }
          },
        },
      ],
    );
  };

  const handleLogout = (): void => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your data will be saved and you can login again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
    );
  };

  const performLogout = async (): Promise<void> => {
    try {
      await logoutUser();
      dispatch(getUserDetails(null));

      setGameState({
        board: createEmptyBoard(),
        currentPlayer: 'X',
        winner: null,
        gameOver: false,
        playerScore: 0,
        aiScore: 0,
        ties: 0,
      });

      router.replace('/walkthrough');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const getStatusText = (): string => {
    if (gameState.winner === 'tie') return "It's a tie!";
    if (gameState.winner === 'X') return 'You win!';
    if (gameState.winner === 'O') return 'AI wins!';
    if (gameState.currentPlayer === 'X') return 'Your turn';
    return 'AI is thinking...';
  };

  const getStatusColor = (): string => {
    if (gameState.winner === 'X') return successColor;
    if (gameState.winner === 'O') return errorColor;
    return textColor;
  };

  // Redirect if no user is logged in
  if (!userDetails) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Redirecting to setup...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title={'Tic Tac Toe'}
        leftComponent={
          <TouchableOpacity
            style={styles.headerButtonWrapper}
            onPress={() => router.push('/settings')}>
            <Settings size={responsiveScale(24)} color={textColor} />
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerRightWrapper}>
            <TouchableOpacity
              style={styles.headerButtonWrapper}
              onPress={() => router.push('/history')}>
              <History size={responsiveScale(24)} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButtonWrapper}
              onPress={handleLogout}>
              <LogOut size={responsiveScale(24)} color={errorColor} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.userInfoWrapper}>
        <ThemedText style={styles.usernameTextStyle}>
          Welcome, {userDetails?.username}!
        </ThemedText>
        <ThemedText style={styles.userStatsStyle}>
          Games: {userDetails?.gamesPlayed || 0} | W: {userDetails?.wins || 0} |
          L: {userDetails?.losses || 0} | T: {userDetails?.ties || 0}
        </ThemedText>
      </View>

      <View style={styles.scoreBoardWrapper}>
        <View style={styles.scoreItemWrapper}>
          <ThemedText style={styles.scoreLabelStyle}>You (X)</ThemedText>
          <RollingNumber
            style={[styles.scoreStyle, { color: successColor }]}
            fontSize={FONT_SIZES.xlarge}
            value={userDetails?.wins || 0}
          />
        </View>

        <View style={styles.scoreItemWrapper}>
          <ThemedText style={styles.scoreLabelStyle}>Ties</ThemedText>
          <RollingNumber
            style={styles.scoreStyle}
            fontSize={FONT_SIZES.xlarge}
            value={userDetails?.ties || 0}
          />
        </View>

        <View style={styles.scoreItemWrapper}>
          <ThemedText style={styles.scoreLabelStyle}>AI (O)</ThemedText>

          <RollingNumber
            style={[styles.scoreStyle, { color: primaryColor }]}
            fontSize={FONT_SIZES.xlarge}
            value={userDetails?.losses || 0}
          />
        </View>
      </View>

      <ThemedText style={[styles.statusTextStyle, { color: getStatusColor() }]}>
        {getStatusText()}
      </ThemedText>

      {gameState.gameOver && userSettings?.autoResetBoard && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          layout={LinearTransition}>
          <ThemedText style={styles.autoResetTextStyle}>
            New game starting in{' '}
            {Math.ceil((userSettings?.resetDelay || 3000) / 1000)} seconds...
          </ThemedText>
        </Animated.View>
      )}

      <GameBoard
        board={gameState.board}
        onCellPress={handleCellPress}
        disabled={gameState.currentPlayer !== 'X' || gameState.gameOver}
        winner={gameState.winner}
      />

      <Animated.View
        style={styles.difficultyContainer}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        layout={LinearTransition}>
        <ThemedText style={styles.difficultyLabelStyle}>Difficulty:</ThemedText>
        <View style={styles.difficultyButtonsWrapper}>
          {(['easy', 'medium', 'hard'] as const).map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButtonStyle,
                difficulty === level && styles.selectedDifficultyWrapper,
              ]}
              onPress={() => setDifficulty(level)}>
              <ThemedText
                style={[
                  styles.difficultyButtonTextStyle,
                  difficulty === level && styles.selectedDifficultyTextStyle,
                ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View
        style={styles.actionButtonsWrapper}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        layout={LinearTransition}>
        <GameButton
          title="New Game"
          onPress={handleNewGame}
          variant="primary"
          style={styles.actionButtonStyle}
        />
        <TouchableOpacity
          style={styles.resetButtonWrapper}
          onPress={resetAllScores}>
          <RotateCcw size={responsiveScale(20)} color={textColor} />
        </TouchableOpacity>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  headerButtonWrapper: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  headerRightWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextStyle: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoWrapper: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  usernameTextStyle: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    paddingBottom: SPACING.xs,
  },
  userStatsStyle: {
    opacity: 0.7,
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
  },
  scoreBoardWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: SPACING.lg,
  },
  scoreItemWrapper: {
    alignItems: 'center',
  },
  scoreLabelStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
    paddingBottom: SPACING.xs,
  },
  scoreStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusTextStyle: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: SPACING.md,
  },
  autoResetTextStyle: {
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
    opacity: 0.7,
    paddingBottom: SPACING.lg,
  },
  difficultyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  difficultyLabelStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    paddingBottom: SPACING.sm,
  },
  difficultyButtonsWrapper: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  difficultyButtonStyle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: responsiveScale(12),
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
  },
  selectedDifficultyWrapper: {
    backgroundColor: COLORS.secondary[500],
    borderColor: COLORS.secondary[500],
  },
  difficultyButtonTextStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
  selectedDifficultyTextStyle: {
    color: COLORS.white,
  },
  actionButtonsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  actionButtonStyle: {
    flex: 1,
  },
  resetButtonWrapper: {
    height: responsiveScale(48),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: responsiveScale(16),
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
  },
});
