import { router } from 'expo-router';
import { ArrowLeft, Clock, RotateCcw, Trophy } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { GameButton } from '@/components/buttons/';
import { RollingNumber, ThemedText, ThemedView } from '@/components/common';
import {
  GameReplayViewer,
  GameReplayViewerRef,
} from '@/components/game/GameReplayViewer';

import { HistoryCard } from '@/components/cards';
import { Header } from '@/components/headers';
import { showErrorToast, showSuccessToast } from '@/components/toast';
import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getUserDetails } from '@/redux/actions';
import { calculateGameStats } from '@/utils/gameLogic';
import { clearUserGameHistory, getGameHistory } from '@/utils/storage';
import { GameResult } from '@/utils/types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

interface ExtendedGameResult extends GameResult {
  boardState: string;
  gameDuration: number;
}

export default function HistoryScreen() {
  const dispatch = useDispatch();

  const { userDetails } = useSelector(
    (state: any) => ({
      userDetails: state.user.userDetails,
    }),
    shallowEqual,
  );

  // State management for history data
  const [gameHistory, setGameHistory] = useState<ExtendedGameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ExtendedGameResult | null>(
    null,
  );

  const gameReplayViewerRef = useRef<GameReplayViewerRef>(null);

  const textColor = useThemeColor({}, 'text');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const warningColor = useThemeColor({}, 'warning');

  // Load history when user details are available
  useEffect(() => {
    if (userDetails) {
      loadHistory();
    }
  }, [userDetails]);

  // Load game history from storage
  const loadHistory = async () => {
    try {
      setLoading(true);
      if (!userDetails?.userId) {
        setGameHistory([]);
        return;
      }

      const history = await getGameHistory(userDetails?.userId);
      setGameHistory(history as ExtendedGameResult[]);
    } catch (error) {
      console.error('Error loading game history:', error);
      showErrorToast('Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // Clear all game history with confirmation
  const handleClearHistory = () => {
    if (!userDetails?.userId) {
      showErrorToast('No user logged in');
      return;
    }

    Alert.alert(
      'Clear Game History',
      `Are you sure you want to clear all game history for ${userDetails?.username}? This will also reset your win/loss stats. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserGameHistory(userDetails?.userId);
              dispatch(
                getUserDetails({
                  ...userDetails,
                  losses: 0,
                  gamesPlayed: 0,
                  ties: 0,
                  wins: 0,
                }),
              );
              setGameHistory([]);
              showSuccessToast('Game history and stats cleared successfully');
            } catch (error) {
              console.error('Error clearing history:', error);
              showErrorToast('Failed to clear game history');
            }
          },
        },
      ],
    );
  };

  // Open game replay viewer
  const handleViewGame = (game: ExtendedGameResult) => {
    setSelectedGame(game);
    gameReplayViewerRef.current?.open(game);
  };

  const handleCloseViewer = () => {
    setSelectedGame(null);
  };

  // Render player statistics section
  const renderStats = () => {
    if (gameHistory.length === 0) return null;

    const stats = calculateGameStats(gameHistory);
    const totalGames = gameHistory.length;

    const winRate =
      totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

    // Calculate average game duration
    const totalDuration = gameHistory.reduce(
      (sum, game) => sum + (game.gameDuration || 0),
      0,
    );
    const avgDuration =
      totalGames > 0 ? Math.floor(totalDuration / totalGames) : 0;

    return (
      <View style={styles.statsContainer}>
        <ThemedText style={styles.statsTitleStyle}>Your Stats</ThemedText>

        <View style={styles.statsGridWrapper}>
          <View style={styles.statItemWrapper}>
            <RollingNumber
              fontSize={FONT_SIZES.large}
              value={totalGames}
              style={styles.statNumberStyle}
            />
            <ThemedText style={styles.statLabelStyle}>Total Games</ThemedText>
          </View>

          <View style={styles.statItemWrapper}>
            <RollingNumber
              fontSize={FONT_SIZES.large}
              value={stats.wins}
              style={[styles.statNumberStyle, { color: successColor }]}
            />
            <ThemedText style={styles.statLabelStyle}>Wins</ThemedText>
          </View>

          <View style={styles.statItemWrapper}>
            <RollingNumber
              fontSize={FONT_SIZES.large}
              value={stats.losses}
              style={[styles.statNumberStyle, { color: errorColor }]}
            />

            <ThemedText style={styles.statLabelStyle}>Losses</ThemedText>
          </View>

          <View style={styles.statItemWrapper}>
            <RollingNumber
              fontSize={FONT_SIZES.large}
              value={stats.ties}
              style={[styles.statNumberStyle, { color: warningColor }]}
            />
            <ThemedText style={styles.statLabelStyle}>Ties</ThemedText>
          </View>
        </View>

        <View style={styles.additionalStatsWrapper}>
          <ThemedText style={styles.winRateTextStyle}>Win Rate:</ThemedText>
          <RollingNumber
            fontSize={FONT_SIZES.large}
            value={`${winRate}`}
            style={[styles.winRateStyle, { color: successColor }]}
          />
          <ThemedText
            style={[
              styles.winRateStyle,
              { fontSize: FONT_SIZES.medium, color: successColor },
            ]}>
            %
          </ThemedText>

          {avgDuration > 0 && (
            <View style={styles.avgDurationContainer}>
              <Clock size={responsiveScale(16)} color={textColor} />
              <ThemedText style={styles.avgDurationTextStyle}>
                Avg Game: {Math.floor(avgDuration / 1000)}s
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render empty state when no games exist
  const renderEmptyState = () => (
    <View style={styles.emptyStateWrapper}>
      <Trophy
        size={responsiveScale(64)}
        color={textColor}
        style={styles.emptyIconWrapper}
      />
      <ThemedText style={styles.emptyTitleStyle}>No Games Yet</ThemedText>
      <ThemedText style={styles.emptyMessageStyle}>
        Start playing to see your game history here!
      </ThemedText>
      <GameButton
        title="Start Playing"
        onPress={() => router.back()}
        style={styles.startButtonWrapper}
      />
    </View>
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: ExtendedGameResult;
    index: number;
  }) => <HistoryCard result={item} index={index} onViewGame={handleViewGame} />;

  // Show loading or redirect if no user
  if (!userDetails) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.headerWrapper}>
          <TouchableOpacity
            style={styles.backButtonWrapper}
            onPress={() => router.back()}>
            <ArrowLeft size={responsiveScale(24)} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.titleTextStyle}>Game History</ThemedText>
          <View style={styles.clearButtonWrapper} />
        </View>
        <View style={styles.emptyStateWrapper}>
          <ThemedText style={styles.emptyMessageStyle}>
            Please log in to view your game history
          </ThemedText>
          <GameButton
            title="Go Back"
            onPress={() => router.back()}
            style={styles.startButtonWrapper}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title={'Game History'}
        onPressBack={() => router.back()}
        rightComponent={
          <TouchableOpacity
            style={styles.clearButtonWrapper}
            onPress={handleClearHistory}
            disabled={gameHistory.length === 0}>
            <RotateCcw
              size={responsiveScale(20)}
              color={
                gameHistory.length === 0
                  ? COLORS.neutral[300]
                  : COLORS.warning[500]
              }
            />
          </TouchableOpacity>
        }
      />

      {renderStats()}

      <FlatList
        data={gameHistory}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[successColor]}
            tintColor={successColor}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      <GameReplayViewer
        ref={gameReplayViewerRef}
        game={selectedGame || ({} as ExtendedGameResult)}
        onClose={handleCloseViewer}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.lg,
  },
  backButtonWrapper: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  clearButtonWrapper: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  titleTextStyle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.transparent,
  },
  statsTitleStyle: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    paddingBottom: SPACING.md,
  },
  statsGridWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingBottom: SPACING.sm,
  },
  statItemWrapper: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  statNumberStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabelStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
    paddingTop: SPACING.xs,
  },
  additionalStatsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  winRateContainer: {
    paddingTop: SPACING.sm,
  },
  winRateTextStyle: {
    fontSize: FONT_SIZES.medium,
    paddingRight: SPACING.xs,
  },
  winRateStyle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  avgDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingLeft: SPACING.lg,
  },
  avgDurationTextStyle: {
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
  },
  listContainer: {
    paddingBottom: SPACING.xl,
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
