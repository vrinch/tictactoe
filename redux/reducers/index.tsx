import { combineReducers } from '@reduxjs/toolkit';
import userReducers from './userReducers';

// Combine all reducers in one place for redux store
export default combineReducers({
  user: userReducers, // Handles user state
});
