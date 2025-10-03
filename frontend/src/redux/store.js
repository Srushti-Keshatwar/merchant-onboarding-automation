import { configureStore } from '@reduxjs/toolkit';
import merchantReducer from './slices'; // Using our new merchant slice

const store = configureStore({
  reducer: {
    merchant: merchantReducer, // Changed to use merchant reducer
  },
});

export default store;