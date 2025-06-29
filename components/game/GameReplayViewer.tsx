import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {
  Clock,
  Handshake,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Target,
  Trophy,
} from 'lucide-react-native';
import {
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { ThemedText } from '@/components/common';
import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { deserializeBoardState, replayGame } from '@/utils/gameLogic';
import { GameBoard } from '@/utils/types';
import moment from 'moment-timezone';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

export interface GameReplayViewerRef {
  open: (game: GameReplayViewerProps['game']) => void;
  close: () => void;
}

interface GameReplayViewerProps {
  visible?: boolean;
  game: {
    id: string;
    username: string;
    result: 'win' | 'lose' | 'tie';
    date: string;
    moves: number;
    difficulty: string;
    boardState: string;
    gameDuration: number;
  };
  onClose?: () => void;
}

export const GameReplayViewer = forwardRef<
  GameReplayViewerRef,
  Omit<GameReplayViewerProps, 'visible'>
>(({ game, onClose }, ref) => {
  const colorScheme = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Replay state management
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [boardStates, setBoardStates] = useState<GameBoard[]>([]);
  const [gameData, setGameData] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<
    GameReplayViewerProps['game'] | null
  >(null);

  const playTimer = useRef<NodeJS.Timeout | null>(null);

  // Theme colors
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const warningColor = useThemeColor({}, 'warning');

  const snapPoints = useMemo(() => ['70%'], []);

  // Handle bottom sheet state changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      // console.log('GameReplayViewer sheet changed to index:', index);

      if (index === -1) {
        // Clean up when sheet closes
        setIsPlaying(false);
        setCurrentStep(0);
        setCurrentGame(null);
        setBoardStates([]);
        setGameData(null);
        if (playTimer.current) {
          clearTimeout(playTimer.current);
        }
        onClose?.();
      }
    },
    [onClose],
  );

  // Render backdrop with dismissal
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Expose open/close methods via ref
  useImperativeHandle(ref, () => ({
    open: (gameToReplay: GameReplayViewerProps['game']) => {
      // console.log('Opening GameReplayViewer with game:', gameToReplay?.id);
      setCurrentGame(gameToReplay);

      // Delay expansion to ensure state is set
      setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 100);
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  // Parse game data and generate board states when game loads
  useEffect(() => {
    if (currentGame?.boardState) {
      // console.log('Initializing game data for:', currentGame.id);
      try {
        const data = deserializeBoardState(currentGame.boardState);
        setGameData(data);
        const states = replayGame(data.moves);
        setBoardStates(states);
        setCurrentStep(0);
        setIsPlaying(false);
        // console.log('Game data initialized, board states:', states.length);
      } catch (error) {
        console.error('Error parsing game data:', error);
        setBoardStates([]);
        setGameData(null);
      }
    }
  }, [currentGame]);

  // Handle auto-play timer
  useEffect(() => {
    if (isPlaying && currentStep < boardStates.length - 1) {
      playTimer.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1000);
    } else if (currentStep >= boardStates.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (playTimer.current) {
        clearTimeout(playTimer.current);
      }
    };
  }, [isPlaying, currentStep, boardStates.length]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (playTimer.current) {
        clearTimeout(playTimer.current);
      }
    };
  }, []);

  const handleClose = () => {
    bottomSheetRef.current?.close();
  };

  // Toggle play/pause or restart if at end
  const handlePlayPause = () => {
    if (currentStep >= boardStates.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Reset replay to beginning
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  // Go to previous step
  const handlePreviousStep = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // Go to next step
  const handleNextStep = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(boardStates.length - 1, prev + 1));
  };

  // Get icon based on game result
  const getResultIcon = () => {
    if (!currentGame) return null;
    switch (currentGame.result) {
      case 'win':
        return <Trophy size={responsiveScale(24)} color={successColor} />;
      case 'lose':
        return <Target size={responsiveScale(24)} color={errorColor} />;
      case 'tie':
        return <Handshake size={responsiveScale(24)} color={warningColor} />;
      default:
        return null;
    }
  };

  // Get color based on game result
  const getResultColor = () => {
    if (!currentGame) return textColor;
    switch (currentGame.result) {
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

  // Format date string for display
  const formatDate = (dateString: string) => {
    return moment
      .tz(dateString, 'America/New_York')
      .format('MMM D, YYYY h:mm A');
  };

  // Get current move data for display
  const getCurrentMove = () => {
    if (!gameData || currentStep === 0) return null;
    const move = gameData.moves[currentStep - 1];
    return move;
  };

  // Calculate replay progress percentage
  const progressPercentage = useMemo(() => {
    if (boardStates.length <= 1) return 0;
    return (currentStep / (boardStates.length - 1)) * 100;
  }, [currentStep, boardStates.length]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: cardColor }}
      handleIndicatorStyle={{
        width: responsiveScale(50),
        backgroundColor: colorScheme === 'dark' ? COLORS.white : COLORS.black,
      }}
      handleStyle={[styles.sheetHandle, { backgroundColor: cardColor }]}>
      <BottomSheetScrollView style={styles.container}>
        {currentGame && boardStates.length > 0 ? (
          <>
            <View style={styles.headerWrapper}>
              <View style={styles.headerLeftWrapper}>
                {getResultIcon()}
                <View style={styles.headerTextWrapper}>
                  <ThemedText
                    style={[
                      styles.resultTextStyle,
                      { color: getResultColor() },
                    ]}>
                    {currentGame.result.charAt(0).toUpperCase() +
                      currentGame.result.slice(1)}
                  </ThemedText>
                  <ThemedText style={styles.dateTextStyle}>
                    {formatDate(currentGame.date)}
                  </ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButtonWrapper}
                onPress={handleClose}>
                <ThemedText
                  style={[
                    styles.closeButtonTextStyle,
                    { color: primaryColor },
                  ]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.gameInfoWrapper,
                { backgroundColor: `${borderColor}20` },
              ]}>
              <View style={styles.infoItemWrapper}>
                <ThemedText style={styles.infoLabelStyle}>Player</ThemedText>
                <ThemedText style={styles.infoValueStyle}>
                  @{currentGame.username}
                </ThemedText>
              </View>

              <View style={styles.infoItemWrapper}>
                <ThemedText style={styles.infoLabelStyle}>
                  Difficulty
                </ThemedText>
                <ThemedText
                  style={[
                    styles.infoValueStyle,
                    { textTransform: 'capitalize' },
                  ]}>
                  {currentGame.difficulty}
                </ThemedText>
              </View>

              <View style={styles.infoItemWrapper}>
                <ThemedText style={styles.infoLabelStyle}>Moves</ThemedText>

                <ThemedText style={styles.infoValueStyle}>
                  {currentGame.moves}
                </ThemedText>
              </View>

              {currentGame.gameDuration > 0 && (
                <View style={styles.infoItemWrapper}>
                  <Clock size={responsiveScale(16)} color={textColor} />
                  <ThemedText style={styles.infoValueStyle}>
                    {formatDuration(currentGame.gameDuration)}
                  </ThemedText>
                </View>
              )}
            </View>

            <Animated.View
              style={styles.currentMoveContainer}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              layout={LinearTransition}>
              <ThemedText style={styles.currentMoveTextStyle}>
                Step {currentStep} of {boardStates.length - 1}
              </ThemedText>
              {getCurrentMove() && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(300)}
                  layout={LinearTransition}>
                  <ThemedText style={styles.moveDetailsStyle}>
                    {getCurrentMove().player} played position{' '}
                    {getCurrentMove().position + 1}
                  </ThemedText>
                </Animated.View>
              )}
            </Animated.View>

            <View style={styles.boardContainer}>
              <GameReplayBoard
                board={boardStates[currentStep] || []}
                currentStep={currentStep}
              />
            </View>

            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: `${borderColor}40` },
                ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: primaryColor,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.controlsWrapper}>
              <TouchableOpacity
                style={[
                  styles.controlButtonStyle,
                  { backgroundColor: `${borderColor}20`, borderColor },
                ]}
                onPress={handleReset}
                disabled={currentStep === 0}>
                <RotateCcw
                  size={responsiveScale(20)}
                  color={currentStep === 0 ? COLORS.neutral[300] : textColor}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButtonStyle,
                  { backgroundColor: `${borderColor}20`, borderColor },
                ]}
                onPress={handlePreviousStep}
                disabled={currentStep === 0}>
                <SkipBack
                  size={responsiveScale(20)}
                  color={currentStep === 0 ? COLORS.neutral[300] : textColor}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButtonStyle,
                  styles.playButtonWrapper,
                  {
                    backgroundColor: `${primaryColor}20`,
                    borderColor: primaryColor,
                  },
                ]}
                onPress={handlePlayPause}>
                {isPlaying ? (
                  <Pause size={responsiveScale(24)} color={primaryColor} />
                ) : (
                  <Play size={responsiveScale(24)} color={primaryColor} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButtonStyle,
                  { backgroundColor: `${borderColor}20`, borderColor },
                ]}
                onPress={handleNextStep}
                disabled={currentStep >= boardStates.length - 1}>
                <SkipForward
                  size={responsiveScale(20)}
                  color={
                    currentStep >= boardStates.length - 1
                      ? COLORS.neutral[300]
                      : textColor
                  }
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingTextStyle}>
              Loading game replay...
            </ThemedText>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

GameReplayViewer.displayName = 'GameReplayViewer';

// Game board component for replaying moves
const GameReplayBoard: FC<{
  board: GameBoard;
  currentStep: number;
}> = ({ board, currentStep }) => {
  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');

  return (
    <View style={replayStyles.boardWrapper}>
      {board.map((cell, index) => (
        <View
          key={index}
          style={[
            replayStyles.cellWrapper,
            {
              backgroundColor: cardColor,
              borderColor,
            },
          ]}>
          <ThemedText style={replayStyles.cellTextStyle}>
            {cell || ''}
          </ThemedText>
        </View>
      ))}
    </View>
  );
};

const replayStyles = StyleSheet.create({
  boardWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: responsiveScale(240),
    justifyContent: 'center',
  },
  cellWrapper: {
    width: responsiveScale(70),
    height: responsiveScale(70),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: responsiveScale(12),
    marginHorizontal: responsiveScale(2),
    marginVertical: responsiveScale(2),
  },
  cellTextStyle: {
    fontSize: responsiveScale(28),
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sheetHandle: {
    borderTopLeftRadius: responsiveScale(20),
    borderTopRightRadius: responsiveScale(20),
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  headerLeftWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  headerTextWrapper: {
    gap: SPACING.xs,
  },
  resultTextStyle: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
  },
  dateTextStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
  },
  closeButtonWrapper: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  closeButtonTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  gameInfoWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: responsiveScale(12),
  },
  infoItemWrapper: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoLabelStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
  },
  infoValueStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
  currentMoveContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  currentMoveTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  moveDetailsStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
    paddingTop: SPACING.xs,
  },
  boardContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  progressContainer: {
    paddingBottom: SPACING.lg,
  },
  progressBar: {
    height: responsiveScale(6),
    borderRadius: responsiveScale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  controlsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  controlButtonStyle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: responsiveScale(12),
    borderWidth: 1,
    minWidth: responsiveScale(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonWrapper: {
    paddingHorizontal: SPACING.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveScale(60),
  },
  loadingTextStyle: {
    fontSize: FONT_SIZES.medium,
    opacity: 0.7,
  },
  bottomSpacing: {
    height: SPACING.xxl,
  },
});

export default GameReplayViewer;
