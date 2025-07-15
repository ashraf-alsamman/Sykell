import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the API service
jest.mock('../../services/apiService', () => ({
  apiService: {
    login: jest.fn(),
  },
}));

describe('Login Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('react-router-dom') as any).useNavigate = () => mockNavigate;
  });

  it('renders login form', () => {
    render(<Login />);
    
    expect(screen.getByText('Website Crawler')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows demo credentials', () => {
    render(<Login />);
    
    expect(screen.getByText('Demo credentials:')).toBeInTheDocument();
    expect(screen.getByText('Username: admin')).toBeInTheDocument();
    expect(screen.getByText('Password: password')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockApiService = require('../../services/apiService').apiService;
    mockApiService.login.mockResolvedValue({
      user: { id: 1, username: 'admin' },
      token: 'test-token',
    });

    render(<Login />);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await userEvent.type(usernameInput, 'admin');
    await userEvent.type(passwordInput, 'password');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiService.login).toHaveBeenCalledWith('admin', 'password');
    });
  });

  it('shows error message on login failure', async () => {
    const mockApiService = require('../../services/apiService').apiService;
    mockApiService.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<Login />);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await userEvent.type(usernameInput, 'wrong');
    await userEvent.type(passwordInput, 'wrong');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  it('enables submit button when form is valid', async () => {
    render(<Login />);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await userEvent.type(usernameInput, 'admin');
    await userEvent.type(passwordInput, 'password');

    expect(submitButton).toBeEnabled();
  });
}); 