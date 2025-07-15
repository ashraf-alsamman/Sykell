import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { checkAuthStatus } from './store/slices/authSlice';
import { apiService } from './services/apiService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AnalysisDetail from './components/AnalysisDetail';
import Header from './components/Header';
import './App.css';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', isLoading);
  
  if (isLoading) {
    return <div>Loading authentication...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  console.log('AppContent - isAuthenticated:', isAuthenticated, 'loading:', isLoading);

  // Initialize authentication state on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set token in API service first
      apiService.setToken(token);
      dispatch(checkAuthStatus());
    }
  }, [dispatch]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="App">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/:id"
            element={
              <ProtectedRoute>
                <AnalysisDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// Root App component with Redux provider
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App; 