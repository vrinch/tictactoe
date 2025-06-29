// Get the store setup function from Redux Toolkit
import { configureStore } from '@reduxjs/toolkit';

// Bring in all our app's reducers
import reducer from '../reducers';

// Set up our app's Redux store
export const store = configureStore({
  reducer, // Use our combined reducers
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false, // Skip checking if state is immutable (for performance)
      serializableCheck: false, // Skip checking if data can be serialized (we have complex objects)
    }),
});
