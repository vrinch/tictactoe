import { router } from 'expo-router';
import { FC, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import { GameButton } from '@/components/buttons';
import { Pagination, ThemedText, ThemedView } from '@/components/common';
import { UsernameSheet, UsernameSheetRef } from '@/components/sheets';
import { USERNAME_COLORS, WALKTHROUGH_DATA } from '@/constants/arrays';
import { SCREEN_WIDTH } from '@/constants/config';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getUserDetails, getUserSettings } from '@/redux/actions';
import {
  createOrLoginUser,
  getUserSettings as getStoredUserSettings,
} from '@/utils/storage';
import { WalkthroughItem } from '@/utils/types';
import { useDispatch } from 'react-redux';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const WalkthroughScreen: FC = () => {
  const dispatch = useDispatch();
  const flatListRef = useRef<FlatList<WalkthroughItem>>(null);
  const usernameSheetRef = useRef<UsernameSheetRef>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get theme colors for consistent styling
  const primaryColor = useThemeColor({}, 'primary');

  // Navigate to next slide in the walkthrough
  const handleNext = () => {
    if (currentIndex < WALKTHROUGH_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  // Navigate to previous slide in the walkthrough
  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  // Show confirmation dialog for skipping walkthrough
  const handleSkip = async () => {
    try {
      Alert.alert(
        'Skip Setup?',
        'You can always set your username later in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Skip',
            onPress: handleSkipConfirmed,
          },
        ],
      );
    } catch (error) {
      console.error('Error in handleSkip:', error);
      Alert.alert('Error', 'Failed to skip setup. Please try again.');
    }
  };

  // Create default user profile and navigate to game
  const handleSkipConfirmed = async () => {
    setIsLoading(true);
    try {
      const defaultUsername = 'Player' + Math.floor(Math.random() * 1000);
      const userProfile = await createOrLoginUser(
        defaultUsername,
        USERNAME_COLORS[0],
      );

      if (userProfile) {
        dispatch(getUserDetails(userProfile));
        const settings = await getStoredUserSettings(userProfile.userId);
        dispatch(getUserSettings(settings));
        router.replace('/game');
      }
    } catch (error) {
      console.error('Error skipping walkthrough:', error);
      Alert.alert('Error', 'Failed to skip setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle username submission and user creation/login
  const handleUsernameSubmit = async (username: string, color: string) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const userProfile = await createOrLoginUser(username, color);

      if (userProfile) {
        dispatch(getUserDetails(userProfile));
        const settings = await getStoredUserSettings(userProfile.userId);
        dispatch(getUserSettings(settings));
        usernameSheetRef.current?.close();

        setTimeout(() => {
          router.replace('/game');
        }, 300);
      }
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Track currently visible slide for pagination
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index!);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  // Render each walkthrough slide with content
  const renderWalkthroughSlide: ListRenderItem<WalkthroughItem> = ({
    item,
  }) => (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      layout={LinearTransition}
      style={styles.slideWrapper}>
      <item.Icon size={responsiveScale(200)} />
      <ThemedText style={styles.titleTextStyle}>{item.title}</ThemedText>
      <ThemedText style={styles.descriptionTextStyle}>
        {item.description}
      </ThemedText>
    </Animated.View>
  );

  const isLastSlide = currentIndex === WALKTHROUGH_DATA.length - 1;

  return (
    <ThemedView style={styles.container}>
      {!isLastSlide && (
        <AnimatedTouchableOpacity
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          layout={LinearTransition}
          style={styles.skipWrapper}
          onPress={handleSkip}
          disabled={isLoading}>
          <ThemedText style={[styles.skipTextStyle, { color: primaryColor }]}>
            Skip
          </ThemedText>
        </AnimatedTouchableOpacity>
      )}

      <FlatList
        data={WALKTHROUGH_DATA}
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.key}
        renderItem={renderWalkthroughSlide}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {isLastSlide ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          layout={LinearTransition}
          style={styles.getStartedWrapper}>
          <GameButton
            title="Get Started"
            onPress={() => usernameSheetRef.current?.open()}
            variant="primary"
            disabled={isLoading}
          />
        </Animated.View>
      ) : (
        <Animated.View
          style={styles.navigationWrapper}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          layout={LinearTransition}>
          <TouchableOpacity
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            onPress={handleBack}
            disabled={currentIndex === 0}
            style={[
              styles.navigationButton,
              { opacity: currentIndex === 0 ? 0.4 : 1 },
            ]}>
            <ThemedText
              style={[
                styles.navigationButtonTextStyle,
                { color: primaryColor },
              ]}>
              Back
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.paginationWrapper}>
            {WALKTHROUGH_DATA.map((_, i) => (
              <Pagination
                key={i}
                activeSlide={currentIndex === i}
                type="circle"
                size={responsiveScale(8)}
                marginHorizontal={responsiveScale(4)}
              />
            ))}
          </View>

          <TouchableOpacity
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            onPress={handleNext}
            disabled={isLastSlide}
            style={[
              styles.navigationButton,
              { opacity: isLastSlide ? 0.4 : 1 },
            ]}>
            <ThemedText
              style={[
                styles.navigationButtonTextStyle,
                { color: primaryColor },
              ]}>
              Next
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      )}

      <UsernameSheet
        ref={usernameSheetRef}
        onSubmit={handleUsernameSubmit}
        isLoading={isLoading}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  skipWrapper: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  skipTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  titleTextStyle: {
    fontSize: FONT_SIZES.xxlarge,
    paddingTop: SPACING.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionTextStyle: {
    fontSize: FONT_SIZES.medium,
    paddingTop: SPACING.md,
    textAlign: 'center',
    opacity: 0.8,
  },
  navigationWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  getStartedWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  navigationButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  navigationButtonTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  paginationWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default WalkthroughScreen;
