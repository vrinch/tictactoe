import { router, Stack } from 'expo-router';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { GameButton } from '@/components/buttons';
import { ThemedText, ThemedView } from '@/components/common';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function NotFoundScreen() {
  // Get theme colors for consistent styling
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor({}, 'error');
  const borderColor = useThemeColor({}, 'border');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Page Not Found',
          headerShown: false,
        }}
      />

      <View style={styles.iconWrapper}>
        <AlertTriangle
          size={responsiveScale(80)}
          color={errorColor}
          strokeWidth={2}
        />
      </View>

      <View style={styles.messageWrapper}>
        <ThemedText style={styles.titleTextStyle}>Oops!</ThemedText>
        <ThemedText style={styles.subtitleTextStyle}>
          This screen doesn't exist.
        </ThemedText>
        <ThemedText style={styles.descriptionTextStyle}>
          The page you're looking for might have been removed, renamed, or is
          temporarily unavailable.
        </ThemedText>
      </View>

      <View style={styles.buttonsWrapper}>
        <GameButton
          title="Go Back"
          onPress={() => router.back()}
          variant="outline"
          style={styles.backButton}
          leftIcon={<ArrowLeft size={responsiveScale(18)} color={textColor} />}
        />

        <GameButton
          title="Go Home"
          onPress={() => router.replace('/game')}
          variant="primary"
          style={styles.homeButton}
          leftIcon={<Home size={responsiveScale(18)} color="#fff" />}
        />
      </View>

      <View style={[styles.helpContainer, { borderColor: `${borderColor}40` }]}>
        <ThemedText style={styles.helpTextStyle}>
          Need help? Try going back to the previous page or return to the home
          screen.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: responsiveScale(60),
  },
  iconWrapper: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: responsiveScale(120),
    height: responsiveScale(120),
    borderRadius: responsiveScale(60),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  messageWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  titleTextStyle: {
    fontWeight: 'bold',
    fontSize: FONT_SIZES.xxlarge * 1.2,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitleTextStyle: {
    fontWeight: '600',
    fontSize: FONT_SIZES.large,
    textAlign: 'center',
    marginBottom: SPACING.md,
    opacity: 0.8,
  },
  descriptionTextStyle: {
    fontSize: FONT_SIZES.medium,
    textAlign: 'center',
    opacity: 0.6,
  },
  buttonsWrapper: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    flex: 1,
  },
  homeButton: {
    flex: 1,
  },
  helpContainer: {
    borderWidth: 1,
    borderRadius: responsiveScale(12),
    padding: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  helpTextStyle: {
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
    opacity: 0.7,
  },
});
