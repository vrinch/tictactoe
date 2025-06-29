import { ThemedText } from '@/components/common';
import React, { FC } from 'react';
import { AnimatedDigitProps } from './types';

// AnimatedDigit is a text component for displaying a single animated digit with tabular alignment
const AnimatedDigit: FC<AnimatedDigitProps> = ({
  children,
  fontSize,
  style,
  ...props
}) => (
  <ThemedText
    {...props}
    style={[
      style,
      {
        fontSize,
        lineHeight: fontSize * 1.1,
        includeFontPadding: false,
        fontVariant: ['tabular-nums'],
      },
    ]}>
    {children}
  </ThemedText>
);

export default AnimatedDigit;
