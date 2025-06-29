import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastManager } from '@/components/toast';
import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '@/redux/store';
import RoutesLayout from '@/routes';
import { sleep } from '@/utils/general';
import { setAudioModeAsync } from 'expo-audio';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Configure splash screen appearance and timing
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

// Configure audio to work in silent mode for game sounds
setAudioModeAsync({
  playsInSilentMode: true,
  interruptionMode: 'mixWithOthers',
  interruptionModeAndroid: 'duckOthers',
});

function RootLayout() {
  // Get current color scheme from device settings
  const colorScheme = useColorScheme();

  // Hide splash screen when component mounts
  useEffect(() => {
    hideSplashScreen();
  }, []);

  // Handle splash screen hiding with proper error handling
  const hideSplashScreen = async () => {
    try {
      await sleep();
      await SplashScreen.hideAsync();
    } catch (error) {
      console.warn('Failed to hide splash screen:', error);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RoutesLayout />
        </ThemeProvider>
        <ToastManager />
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootLayout;
