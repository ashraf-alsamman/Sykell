import authReducer, { clearError, logout } from '../authSlice';
import { loginUser, logoutUser, checkAuthStatus } from '../authSlice';

describe('Auth Slice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearError', () => {
    const state = { ...initialState, error: 'Some error' };
    const newState = authReducer(state, clearError());
    expect(newState.error).toBeNull();
  });

  it('should handle logout', () => {
    const state = {
      ...initialState,
      user: { id: 1, username: 'admin' },
      token: 'test-token',
      isAuthenticated: true,
    };
    const newState = authReducer(state, logout());
    expect(newState.user).toBeNull();
    expect(newState.token).toBeNull();
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.error).toBeNull();
  });

  describe('loginUser thunk', () => {
    it('should handle pending state', () => {
      const action = { type: loginUser.pending.type };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockUser = { id: 1, username: 'admin' };
      const mockToken = 'test-token';
      const action = {
        type: loginUser.fulfilled.type,
        payload: { user: mockUser, token: mockToken },
      };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(false);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user).toEqual(mockUser);
      expect(newState.token).toBe(mockToken);
      expect(newState.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const errorMessage = 'Login failed';
      const action = {
        type: loginUser.rejected.type,
        error: { message: errorMessage },
      };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
    });
  });

  describe('logoutUser thunk', () => {
    it('should handle pending state', () => {
      const action = { type: logoutUser.pending.type };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const state = {
        ...initialState,
        user: { id: 1, username: 'admin' },
        token: 'test-token',
        isAuthenticated: true,
      };
      const action = { type: logoutUser.fulfilled.type };
      const newState = authReducer(state, action);
      expect(newState.isLoading).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const state = {
        ...initialState,
        user: { id: 1, username: 'admin' },
        token: 'test-token',
        isAuthenticated: true,
      };
      const action = { type: logoutUser.rejected.type };
      const newState = authReducer(state, action);
      expect(newState.isLoading).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuthStatus thunk', () => {
    it('should handle pending state', () => {
      const action = { type: checkAuthStatus.pending.type };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(true);
    });

    it('should handle fulfilled state with user data', () => {
      const mockUser = { id: 1, username: 'admin' };
      const action = {
        type: checkAuthStatus.fulfilled.type,
        payload: { user: mockUser },
      };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(false);
      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
    });

    it('should handle fulfilled state without user data', () => {
      const action = {
        type: checkAuthStatus.fulfilled.type,
        payload: null,
      };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
    });

    it('should handle rejected state', () => {
      const action = { type: checkAuthStatus.rejected.type };
      const newState = authReducer(initialState, action);
      expect(newState.isLoading).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
    });
  });
}); 