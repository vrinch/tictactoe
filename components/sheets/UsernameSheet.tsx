import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { GameButton } from '@/components/buttons';
import { ThemedText } from '@/components/common';
import { USERNAME_COLORS } from '@/constants/arrays';
import { COLORS } from '@/constants/Colors';
import { FONT_SIZES, responsiveScale, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { validateUsername } from '@/utils/general';
import { checkUserExists } from '@/utils/storage';
import { showErrorToast } from '../toast';

export interface UsernameSheetRef {
  open: () => void;
  close: () => void;
}

interface UsernameSheetProps {
  onSubmit: (username: string, color: string) => void;
  isLoading?: boolean;
  currentUsername?: string;
  currentColor?: string;
}

const UsernameSheet = forwardRef<UsernameSheetRef, UsernameSheetProps>(
  (
    {
      onSubmit,
      isLoading = false,
      currentUsername = '',
      currentColor = USERNAME_COLORS[0],
    },
    ref,
  ) => {
    const colorScheme = useColorScheme();
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [username, setUsername] = useState(currentUsername);
    const [selectedColor, setSelectedColor] = useState(currentColor);
    const [errors, setErrors] = useState<{ username?: string }>({});
    const [isCheckingUser, setIsCheckingUser] = useState(false);

    // Get theme colors for consistent styling
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const cardColor = useThemeColor({}, 'card');
    const errorColor = useThemeColor({}, 'error');

    // Bottom sheet configuration
    const snapPoints = useMemo(() => ['50%'], []);

    // Handle sheet state changes
    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        setErrors({});
      }
    }, []);

    // Render backdrop with dismiss functionality
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          onPress={Keyboard.dismiss}
        />
      ),
      [],
    );

    // Expose sheet control methods to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        setUsername(currentUsername);
        setSelectedColor(currentColor);
        setErrors({});
        bottomSheetRef.current?.expand();
      },
      close: () => {
        setErrors({});
        bottomSheetRef.current?.close();
      },
    }));

    // Handle username input changes with validation
    const handleUsernameChange = (value: string) => {
      setUsername(value);

      if (errors.username) {
        setErrors(prev => ({ ...prev, username: undefined }));
      }
    };

    // Check if username already exists in database
    const checkUsernameAvailability = async (
      username: string,
    ): Promise<boolean> => {
      if (currentUsername && username === currentUsername) {
        return true;
      }

      try {
        setIsCheckingUser(true);
        const exists = await checkUserExists(username);

        if (exists) {
          return new Promise(resolve => {
            resolve(true);
          });
        }

        return true;
      } catch (error) {
        console.error('Error checking username:', error);
        return true;
      } finally {
        setIsCheckingUser(false);
      }
    };

    // Handle form submission with validation
    const handleSubmit = async () => {
      const trimmedUsername = username.trim();

      const usernameError = validateUsername(trimmedUsername);

      if (usernameError) {
        showErrorToast(usernameError);
        setErrors({ username: usernameError });
        return;
      }

      const isAvailable = await checkUsernameAvailability(trimmedUsername);
      if (!isAvailable) {
        return;
      }

      setErrors({});
      onSubmit(trimmedUsername, selectedColor);
    };

    // Handle cancel button press
    const handleCancel = () => {
      Keyboard.dismiss();
      bottomSheetRef.current?.close();
    };

    // Render color selection grid
    const renderColorPicker = () => (
      <View style={styles.colorPickerWrapper}>
        <ThemedText style={styles.colorLabelTextStyle}>
          Choose your color:
        </ThemedText>
        <View style={styles.colorGridWrapper}>
          {USERNAME_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOptionButton,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColorOption,
              ]}
              onPress={() => setSelectedColor(color)}
              activeOpacity={0.8}
              disabled={isLoading || isCheckingUser}
            />
          ))}
        </View>
      </View>
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        keyboardBehavior={'interactive'}
        keyboardBlurBehavior={'restore'}
        enablePanDownToClose={!isLoading}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: cardColor }}
        handleIndicatorStyle={{
          width: responsiveScale(50),
          backgroundColor: colorScheme === 'dark' ? COLORS.white : COLORS.black,
        }}
        handleStyle={[
          styles.sheetHandleContainer,
          { backgroundColor: cardColor },
        ]}>
        <BottomSheetView style={styles.sheetContentWrapper}>
          <ThemedText style={styles.headerTitleTextStyle}>
            {currentUsername ? 'Update Profile' : "What's your username?"}
          </ThemedText>

          <ThemedText style={styles.headerSubtitleTextStyle}>
            {currentUsername
              ? 'Change your username and color'
              : 'Choose a username to get started playing'}
          </ThemedText>

          <View style={styles.usernameInputWrapper}>
            <ThemedText style={styles.inputLabelTextStyle}>Username</ThemedText>
            <View
              style={[
                styles.textInputContainer,
                {
                  borderColor: errors.username ? errorColor : borderColor,
                },
              ]}>
              <ThemedText
                style={[
                  styles.atSymbolTextStyle,
                  { opacity: !!username ? 1 : 0.7 },
                ]}>
                @
              </ThemedText>
              <BottomSheetTextInput
                style={[
                  styles.usernameTextInputStyle,
                  {
                    color: textColor,
                  },
                ]}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="vincent"
                placeholderTextColor={
                  colorScheme === 'light'
                    ? 'rgba(0, 0, 0, 0.4)'
                    : 'rgba(255, 255, 255, 0.4)'
                }
                maxLength={20}
                autoFocus={false}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isLoading}
                blurOnSubmit
              />
            </View>
          </View>

          {renderColorPicker()}

          <View style={styles.actionButtonsWrapper}>
            <GameButton
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              style={styles.cancelButton}
              disabled={isLoading}
            />
            <GameButton
              title={
                isLoading
                  ? 'Saving...'
                  : currentUsername
                    ? 'Update'
                    : 'Continue'
              }
              onPress={handleSubmit}
              style={styles.submitButton}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

UsernameSheet.displayName = 'UsernameSheet';

const styles = StyleSheet.create({
  sheetHandleContainer: {
    borderTopLeftRadius: responsiveScale(20),
    borderTopRightRadius: responsiveScale(20),
  },
  sheetContentWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: responsiveScale(34),
  },
  headerTitleTextStyle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: SPACING.sm,
  },
  headerSubtitleTextStyle: {
    fontSize: FONT_SIZES.medium,
    textAlign: 'center',
    paddingBottom: SPACING.md,
    opacity: 0.7,
  },
  usernameInputWrapper: {
    paddingBottom: SPACING.md,
  },
  inputLabelTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    paddingBottom: SPACING.sm,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: responsiveScale(12),
    minHeight: responsiveScale(50),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  atSymbolTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    paddingLeft: SPACING.md,
  },
  usernameTextInputStyle: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: responsiveScale(50),
  },
  colorPickerWrapper: {
    paddingBottom: SPACING.xl,
  },
  colorLabelTextStyle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    paddingBottom: SPACING.md,
  },
  colorGridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  colorOptionButton: {
    width: responsiveScale(40),
    height: responsiveScale(40),
    borderRadius: responsiveScale(40),
    paddingBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.transparent,
  },
  selectedColorOption: {
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    transform: [{ scale: 1.1 }],
  },
  actionButtonsWrapper: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default UsernameSheet;
