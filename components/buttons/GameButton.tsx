import { FC, ReactNode } from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import Button, { ButtonSize } from './Button';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success';
  size?: ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fontSize?: number;
  onLongPress?: () => void;
  enableHaptic?: boolean;
  enableAnimation?: boolean;
}

const GameButton: FC<GameButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  isLoading = false,
  loadingText,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fontSize,
  onLongPress,
  enableHaptic = true,
  enableAnimation = true,
}) => {
  return (
    <Button
      title={title}
      onPress={onPress}
      variant={variant}
      size={size}
      disabled={disabled}
      isLoading={isLoading}
      loadingText={loadingText}
      style={style}
      textStyle={textStyle}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      onLongPress={onLongPress}
      enableHaptic={enableHaptic}
      enableAnimation={enableAnimation}
      enableRipple={true}
      fontSize={fontSize}
    />
  );
};

export default GameButton;
