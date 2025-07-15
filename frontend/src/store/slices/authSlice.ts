import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';

interface User {
  id: number;
  username: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { username: string; password: string }) => {
    const response = await apiService.login(credentials.username, credentials.password);
    return response;
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    // Call logout API if needed
    // await apiService.logout();
    return null;
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    // Verify token with backend
    const response = await apiService.getCurrentUser();
    return response;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    // Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        // Convert the user object to match our User interface
        const user = {
          id: action.payload.user.id,
          username: action.payload.user.username,
          email: (action.payload.user as any).email || undefined, // Handle optional email
        };
        state.user = user;
        state.token = action.payload.token;
        state.error = null;
        localStorage.setItem('token', action.payload.token);
        apiService.setToken(action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Logout User
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('token');
        // Clear token in API service
        apiService.setToken(null);
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        // Even if logout fails, clear local state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      });

    // Check Auth Status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          // Convert the user object to match our User interface
          const user = {
            id: action.payload.user.id,
            username: action.payload.user.username,
            email: (action.payload.user as any).email || undefined, // Handle optional email
          };
          state.user = user;
          state.isAuthenticated = true;
          // Set token in API service if we have one
          const token = localStorage.getItem('token');
          if (token) {
            apiService.setToken(token);
          }
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      });
  },
});

export const { 
  clearError, 
  logout
} = authSlice.actions;

export default authSlice.reducer; 