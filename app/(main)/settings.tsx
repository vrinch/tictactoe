import { router } from 'expo-router';
import {
  ArrowLeft,
  Bot,
  Download,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { GameButton } from '@/components/buttons';
import {
  DelaySelector,
  RollingNumber,
  ThemedText,
  ThemedView,
  ToggleSwitch,
} from '@/components/common';
import { UsernameSheet, UsernameSheetRef } from '@/components/sheets';

import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

import { SettingsCard } from '@/components/cards';
import { Header } from '@/components/headers';
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from '@/components/toast';
import { getUserDetails, getUserSettings } from '@/redux/actions';
import { lightenHex } from '@/utils/general';
import {
  checkUserExists,
  clearUserGameHistory,
  saveOrUpdateUserProfile,
  saveUserSettings,
} from '@/utils/storage';
import { UserSettings } from '@/utils/types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

export default function SettingsScreen() {
  const dispatch = useDispatch();

  const { userDetails, userSettings } = useSelector(
    (state: any) => ({
      userDetails: state.user.userDetails,
      userSettings: state.user.userSettings,
    }),
    shallowEqual,
  );

  const [isLoading, setIsLoading] = useState(false);

  const usernameSheetRef = useRef<UsernameSheetRef>(null);

  // Theme colors
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const warningColor = useThemeColor({}, 'warning');

  // Save user settings to storage and redux
  const saveSettings = async (newSettings: UserSettings) => {
    if (!userDetails) return;

    try {
      await saveUserSettings(userDetails?.userId, newSettings);
      dispatch(getUserSettings(newSettings));
      showSuccessToast('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast('Failed to save settings');
    }
  };

  // Update username and profile color
  const handleUsernameUpdate = async (username: string, color: string) => {
    if (!userDetails) return;

    try {
      setIsLoading(true);

      // Check if username already exists if changed
      if (username !== userDetails?.username) {
        const usernameExists = await checkUserExists(username);
        if (usernameExists) {
          showErrorToast('Username already exists');
          return;
        }
      }

      const updatedProfile = {
        ...userDetails,
        username,
        color,
      };

      Keyboard.dismiss();
      await saveOrUpdateUserProfile(updatedProfile);
      dispatch(getUserDetails(updatedProfile));
      usernameSheetRef.current?.close();
      showSuccessToast('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all game history and stats with confirmation
  const handleClearGameData = () => {
    if (!userDetails) return;

    Alert.alert(
      'Clear Game Data',
      `Are you sure you want to clear all game history and reset your stats for ${userDetails?.username}? This action cannot be undone.\n\nThis will:\n• Delete all game history\n• Reset wins/losses/ties to 0\n• Keep your username and settings`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserGameHistory(userDetails?.userId);

              const resetProfile = {
                ...userDetails,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                ties: 0,
              };
              dispatch(getUserDetails(resetProfile));

              showSuccessToast('Game data cleared successfully');
            } catch (error) {
              console.error('Error clearing game data:', error);
              showErrorToast('Failed to clear game data');
            }
          },
        },
      ],
    );
  };

  // Future export functionality
  const handleExportData = () => {
    showWarningToast('Export feature coming soon!');
  };

  // Delay selector for auto-reset timing

  if (!userDetails) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.headerWrapper}>
          <TouchableOpacity
            style={styles.backButtonWrapper}
            onPress={() => router.back()}>
            <ArrowLeft size={responsiveScale(24)} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.titleTextStyle}>Settings</ThemedText>
          <View style={styles.placeholderWrapper} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText>Please log in to access settings</ThemedText>
          <GameButton title="Go Back" onPress={() => router.back()} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title={'Settings'}
        onPressBack={() => router.back()}
        style={{ paddingHorizontal: SPACING.md }}
      />

      <ScrollView
        style={styles.contentWrapper}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sectionWrapper}>
          <ThemedText style={styles.sectionTitleStyle}>Profile</ThemedText>

          <SettingsCard
            title="Username"
            profile
            userColor={userDetails?.color}
            subtitle={`@${userDetails?.username}`}
            onPress={() => usernameSheetRef.current?.open()}
            rightElement={
              <ThemedText style={styles.editTextStyle}>Edit</ThemedText>
            }
          />

          <View
            style={[
              styles.statsCardWrapper,
              { backgroundColor: cardColor, borderColor },
            ]}>
            <ThemedText style={styles.statsTitleStyle}>Your Stats</ThemedText>
            <View style={styles.statsRowWrapper}>
              <View style={styles.statItemWrapper}>
                <RollingNumber
                  fontSize={FONT_SIZES.large}
                  value={userDetails?.gamesPlayed || 0}
                  style={styles.statNumberStyle}
                />
                <ThemedText style={styles.statLabelStyle}>Games</ThemedText>
              </View>
              <View style={styles.statItemWrapper}>
                <RollingNumber
                  fontSize={FONT_SIZES.large}
                  value={userDetails?.wins || 0}
                  style={[styles.statNumberStyle, { color: primaryColor }]}
                />
                <ThemedText style={styles.statLabelStyle}>Wins</ThemedText>
              </View>
              <View style={styles.statItemWrapper}>
                <RollingNumber
                  fontSize={FONT_SIZES.large}
                  value={userDetails?.losses || 0}
                  style={[styles.statNumberStyle, { color: errorColor }]}
                />
                <ThemedText style={styles.statLabelStyle}>Losses</ThemedText>
              </View>
              <View style={styles.statItemWrapper}>
                <RollingNumber
                  fontSize={FONT_SIZES.large}
                  value={userDetails?.ties || 0}
                  style={[styles.statNumberStyle, { color: warningColor }]}
                />
                <ThemedText style={styles.statLabelStyle}>Ties</ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <ThemedText style={styles.sectionTitleStyle}>
            Game Settings
          </ThemedText>

          <ToggleSwitch
            icon={<Bot size={responsiveScale(20)} color={primaryColor} />}
            title="AI Plays First"
            subtitle="Let the AI make the first move"
            value={userSettings?.aiPlaysFirst || false}
            onValueChange={value =>
              saveSettings({ ...userSettings, aiPlaysFirst: value })
            }
          />

          <ToggleSwitch
            icon={<RotateCcw size={responsiveScale(20)} color={primaryColor} />}
            title="Auto Reset Board"
            subtitle="Automatically start new game after completion"
            value={userSettings?.autoResetBoard || false}
            onValueChange={value =>
              saveSettings({ ...userSettings, autoResetBoard: value })
            }
          />

          {userSettings?.autoResetBoard && (
            <View style={styles.subSettingWrapper}>
              <ThemedText style={styles.subSettingTitleStyle}>
                Reset Delay
              </ThemedText>
              <DelaySelector
                onPress={delay =>
                  saveSettings({ ...userSettings, resetDelay: delay })
                }
                userSettings={userSettings}
              />
            </View>
          )}
        </View>

        <View style={styles.sectionWrapper}>
          <ThemedText style={styles.sectionTitleStyle}>
            Audio & Haptics
          </ThemedText>

          <ToggleSwitch
            icon={
              userSettings?.soundEnabled ? (
                <Volume2 size={responsiveScale(20)} color={primaryColor} />
              ) : (
                <VolumeX
                  size={responsiveScale(20)}
                  color={lightenHex(primaryColor)}
                />
              )
            }
            title="Sound Effects"
            subtitle="Play sounds for moves and game events"
            value={userSettings?.soundEnabled || false}
            onValueChange={value =>
              saveSettings({ ...userSettings, soundEnabled: value })
            }
          />

          <ToggleSwitch
            icon={
              userSettings?.hapticEnabled ? (
                <Zap size={responsiveScale(20)} color={primaryColor} />
              ) : (
                <ZapOff
                  size={responsiveScale(20)}
                  color={lightenHex(primaryColor)}
                />
              )
            }
            title="Haptic Feedback"
            subtitle="Vibrate on interactions"
            value={userSettings?.hapticEnabled || false}
            onValueChange={value =>
              saveSettings({ ...userSettings, hapticEnabled: value })
            }
          />
        </View>

        <View style={styles.sectionWrapper}>
          <ThemedText style={styles.sectionTitleStyle}>
            Data Management
          </ThemedText>

          <SettingsCard
            icon={<Download size={responsiveScale(20)} color={primaryColor} />}
            title="Export Game Data"
            subtitle="Download your game history"
            onPress={handleExportData}
          />

          <SettingsCard
            icon={<Trash2 size={responsiveScale(20)} color={errorColor} />}
            title="Clear Game Data"
            subtitle="Reset all stats and delete game history"
            onPress={handleClearGameData}
            danger
          />
        </View>

        <View style={styles.bottomSpacingWrapper} />
      </ScrollView>

      <UsernameSheet
        onSubmit={handleUsernameUpdate}
        currentUsername={userDetails?.username}
        currentColor={userDetails?.color}
        ref={usernameSheetRef}
        isLoading={isLoading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  backButtonWrapper: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  titleTextStyle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
  },
  placeholderWrapper: {
    width: responsiveScale(40),
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  sectionWrapper: {
    paddingBottom: SPACING.xl,
  },
  sectionTitleStyle: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    paddingBottom: SPACING.md,
  },
  settingRowWrapper: {
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
    backgroundColor: COLORS.neutral[100],
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
  editTextStyle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary[500],
    fontWeight: '600',
  },
  statsCardWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: responsiveScale(12),
    borderWidth: 1,
    paddingTop: SPACING.sm,
  },
  statsTitleStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: SPACING.md,
  },
  statsRowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItemWrapper: {
    alignItems: 'center',
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
  subSettingWrapper: {
    paddingTop: SPACING.sm,
  },
  subSettingTitleStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    paddingBottom: SPACING.sm,
  },
  delaySelectorWrapper: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  delayOptionWrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: responsiveScale(6),
    borderWidth: 1,
  },
  delayTextStyle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
  bottomSpacingWrapper: {
    height: SPACING.xxl,
  },
});
