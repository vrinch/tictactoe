import {
  RESET_USER_ACTIONS,
  USER_DETAILS,
  USER_SETTINGS,
} from '@/redux/actions/types';

type actionProps = {
  type: string;
  payload?: any;
};

// Default user state
const initialState = {
  userDetails: null,
  userSettings: null,
};

// Handles all user-related state changes
const userReducers = (state = initialState, action: actionProps) => {
  switch (action.type) {
    case RESET_USER_ACTIONS:
      return initialState;

    case USER_DETAILS:
      return { ...state, userDetails: action.payload };

    case USER_SETTINGS:
      return { ...state, userSettings: action.payload };

    default:
      return state;
  }
};

export default userReducers;
