import { initializeDatabase } from '@/utils/storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Root layout handles navigation stack and app-wide setup
export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize SQLite database on mount
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="walkthrough" />
        <Stack.Screen name="game" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
