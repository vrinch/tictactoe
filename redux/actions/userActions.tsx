import { UserProfile, UserSettings } from '@/utils/types';
import { RESET_USER_ACTIONS, USER_DETAILS, USER_SETTINGS } from './types';

// Clear all user-related state
export const resetUserActions = () => ({
  type: RESET_USER_ACTIONS,
});

// Update user profile in redux store
export const getUserDetails = (userDetails: UserProfile | null) => {
  return {
    type: USER_DETAILS,
    payload: userDetails,
  };
};

// Update user settings in redux store
export const getUserSettings = (userSettings: UserSettings | null) => {
  return {
    type: USER_SETTINGS,
    payload: userSettings,
  };
};
