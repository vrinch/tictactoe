import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { ThemedView } from '@/components/common';
import { Logo } from '@/components/svgicons';
import { showErrorToast } from '@/components/toast';
import { COLORS } from '@/constants/Colors';
import { responsiveScale } from '@/constants/theme';
import { getUserDetails, getUserSettings } from '@/redux/actions';
import {
  getCurrentUser,
  getUserSettings as getUserSettingsFromDatabase,
  initializeDatabase,
} from '@/utils/storage';
import { useDispatch } from 'react-redux';

export default function IndexScreen() {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();

  // Check user status and navigate accordingly when component mounts
  useEffect(() => {
    checkUserAndNavigate();
  }, []);

  // Check if user exists and navigate to appropriate screen
  const checkUserAndNavigate = async () => {
    try {
      // console.log('Checking first-time user...');

      // Initialize database first and wait for completion
      await initializeDatabase();

      // Check if user profile exists in database
      const userProfile = await getCurrentUser();

      if (userProfile) {
        // User exists - load their data and go to game
        dispatch(getUserDetails(userProfile));
        const userSettings = await getUserSettingsFromDatabase(
          userProfile.userId,
        );
        dispatch(getUserSettings(userSettings));
        router.replace('/game');
      } else {
        // No user found - send to walkthrough for onboarding
        router.replace('/walkthrough');
      }
    } catch (error) {
      console.error('Error checking first-time user:', error);
      showErrorToast(`Initialization error: ${error.message}`);
      router.replace('/walkthrough');
    }
  };

  return (
    <ThemedView
      style={[
        styles.container,
        // {
        //   backgroundColor:
        //     colorScheme === 'light' ? COLORS.white : COLORS.black,
        // },
      ]}>
      <Logo
        color={colorScheme === 'dark' && COLORS.white}
        size={responsiveScale(200)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
