import { FC, ReactNode } from 'react';
import { Switch } from 'react-native';

import { COLORS } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

import { SettingsCard } from '../cards';

// Switch setting component for toggle options
const ToggleSwitch: FC<{
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}> = ({ icon, title, subtitle, value, onValueChange }) => {
  // Theme colors
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');

  return (
    <SettingsCard
      icon={icon}
      title={title}
      subtitle={subtitle}
      rightElement={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: borderColor, true: `${primaryColor}40` }}
          thumbColor={value ? primaryColor : COLORS.neutral[100]}
        />
      }
    />
  );
};

export default ToggleSwitch;
