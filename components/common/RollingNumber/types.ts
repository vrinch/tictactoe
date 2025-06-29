import { TextProps, TextStyle } from 'react-native';

export interface AnimatedDigitProps extends TextProps {
  fontSize: number;
  style?: TextStyle | TextStyle[];
}

export interface RollingDigitColumnProps {
  digit: number;
  fontSize: number;
  index: number;
  style?: TextStyle | TextStyle[];
  allowFontScaling?: boolean;
}

export interface RollingNumberProps {
  value: number | string;
  fontSize?: number;
  stringStyle?: TextStyle | TextStyle[];
  style?: TextStyle | TextStyle[];
  allowFontScaling?: boolean;
}
