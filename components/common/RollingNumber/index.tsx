import React, { FC, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import AnimatedDigit from './AnimatedDigit';
import RollingDigitColumn from './RollingDigitColumn';
import { RollingNumberProps } from './types';

// RollingNumber displays animated numbers with rolling digit effect
const RollingNumber: FC<RollingNumberProps> = ({
  value,
  fontSize = 15,
  stringStyle,
  style,
  allowFontScaling,
}) => {
  const [dynamicFontSize, setDynamicFontSize] = useState(Math.round(fontSize));

  const stringified = String(value);
  const characters = stringified.split('');

  return (
    <View style={styles.container}>
      <AnimatedDigit
        fontSize={Math.round(fontSize)}
        numberOfLines={1}
        adjustsFontSizeToFit
        allowFontScaling={allowFontScaling}
        onTextLayout={event => {
          if (event.nativeEvent.lines?.[0]) {
            setDynamicFontSize(event.nativeEvent.lines[0].ascender);
          }
        }}
        style={styles.hiddenMeasurementText}>
        {stringified}
      </AnimatedDigit>

      <View style={styles.digitsWrapper}>
        {characters.map((char, index) => {
          const numericValue = parseInt(char, 10);
          const isNumber = !isNaN(numericValue);

          if (isNumber) {
            return (
              <RollingDigitColumn
                key={index}
                index={index}
                digit={numericValue}
                fontSize={dynamicFontSize}
                style={style}
                allowFontScaling={allowFontScaling}
              />
            );
          }

          // Non-numeric characters like periods or percentage signs
          return (
            <AnimatedDigit
              key={index}
              fontSize={dynamicFontSize}
              allowFontScaling={allowFontScaling}
              style={style || stringStyle}>
              {char}
            </AnimatedDigit>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Main wrapper for rolling number component
  },
  hiddenMeasurementText: {
    position: 'absolute',
    top: 10000,
    left: 10000,
    opacity: 0,
  },
  digitsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

export default RollingNumber;
