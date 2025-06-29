import { MotiView } from 'moti';
import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';

import AnimatedDigit from './AnimatedDigit';
import { STAGGER_DELAY, numberRange } from './helper';
import { RollingDigitColumnProps } from './types';

// RollingDigitColumn animates a single digit column in rolling number display
const RollingDigitColumn: FC<RollingDigitColumnProps> = ({
  digit,
  fontSize,
  index,
  style,
  allowFontScaling,
}) => {
  // Calculate width based on font size for monospace effect
  const digitWidth = fontSize * 0.7;

  return (
    <View
      style={[
        styles.digitColumnWrapper,
        { height: fontSize, width: digitWidth },
      ]}>
      <MotiView
        animate={{ translateY: -fontSize * 1.1 * digit }}
        transition={{
          delay: index * STAGGER_DELAY,
          damping: 80,
          stiffness: 200,
        }}>
        {numberRange.map(num => (
          <AnimatedDigit
            allowFontScaling={allowFontScaling}
            fontSize={fontSize}
            key={`digit-${num}`}
            style={style}>
            {num}
          </AnimatedDigit>
        ))}
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  digitColumnWrapper: {
    overflow: 'hidden',
  },
});

export default RollingDigitColumn;
