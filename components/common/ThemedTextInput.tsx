import { forwardRef } from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

const ThemedTextInput = forwardRef<RNTextInput, ThemedTextInputProps>(
  ({ lightColor, darkColor, style, ...props }, ref) => {
    const textColor = useThemeColor(
      { light: lightColor, dark: darkColor },
      'text',
    );
    const backgroundColor = useThemeColor(
      { light: lightColor, dark: darkColor },
      'background',
    );

    return (
      <RNTextInput
        style={[{ color: textColor }, style]}
        underlineColorAndroid={'transparent'}
        ref={ref}
        {...props}
      />
    );
  },
);

ThemedTextInput.displayName = 'ThemedTextInput';

export default ThemedTextInput;
