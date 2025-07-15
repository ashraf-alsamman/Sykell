import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UrlState {
  currentUrl: string;
  isValid: boolean;
  isSubmitting: boolean;
  error: string | null;
  recentUrls: string[];
}

const initialState: UrlState = {
  currentUrl: '',
  isValid: false,
  isSubmitting: false,
  error: null,
  recentUrls: [],
};

const urlSlice = createSlice({
  name: 'url',
  initialState,
  reducers: {
    setUrl: (state, action: PayloadAction<string>) => {
      state.currentUrl = action.payload;
      state.isValid = action.payload.length > 0;
      state.error = null;
    },
    validateUrl: (state, action: PayloadAction<boolean>) => {
      state.isValid = action.payload;
      if (!action.payload) {
        state.error = 'Please enter a valid URL';
      } else {
        state.error = null;
      }
    },
    setUrlError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isValid = false;
    },
    clearUrlError: (state) => {
      state.error = null;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    addRecentUrl: (state, action: PayloadAction<string>) => {
      const url = action.payload;
      if (!state.recentUrls.includes(url)) {
        state.recentUrls.unshift(url);
        // Keep only the last 10 URLs
        if (state.recentUrls.length > 10) {
          state.recentUrls = state.recentUrls.slice(0, 10);
        }
      }
    },
    clearRecentUrls: (state) => {
      state.recentUrls = [];
    },
    clearCurrentUrl: (state) => {
      state.currentUrl = '';
      state.isValid = false;
      state.error = null;
    },
  },
});

export const {
  setUrl,
  validateUrl,
  setUrlError,
  clearUrlError,
  setSubmitting,
  addRecentUrl,
  clearRecentUrls,
  clearCurrentUrl,
} = urlSlice.actions;

export default urlSlice.reducer; 