import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock the API service
jest.mock('../../services/apiService', () => ({
  apiService: {
    getURLs: jest.fn(),
    createURL: jest.fn(),
    bulkDeleteURLs: jest.fn(),
    bulkRerunURLs: jest.fn(),
  },
}));

describe('Dashboard Component', () => {
  const mockAnalyses = [
    {
      id: 1,
      url: 'https://example.com',
      status: 'completed',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      url: 'https://test.com',
      status: 'running',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const mockApiService = require('../../services/apiService').apiService;
    mockApiService.getURLs.mockResolvedValue({
      urls: mockAnalyses,
      total: 2,
      page: 1,
      page_size: 10,
      total_pages: 1,
    });
    mockApiService.createURL.mockResolvedValue(mockAnalyses[0]);
  });

  it('renders dashboard with title', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('URL Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Add New URL')).toBeInTheDocument();
    });
  });

  it('displays URL input form', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Add New URL')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add URL' })).toBeInTheDocument();
    });
  });

  it('shows filters', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });
  });

  it('displays analyses in table', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('https://test.com')).toBeInTheDocument();
    });
  });

  it('shows status badges', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  it('handles bulk selection', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first URL
    });

    expect(screen.getByText('Delete Selected (1)')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const mockApiService = require('../../services/apiService').apiService;
    mockApiService.getURLs.mockImplementation(() => new Promise(() => {}));
    
    render(<Dashboard />);
    
    expect(screen.getByText('Loading URLs...')).toBeInTheDocument();
  });

  it('shows empty state when no URLs', async () => {
    const mockApiService = require('../../services/apiService').apiService;
    mockApiService.getURLs.mockResolvedValue({
      urls: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    });
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No URLs found. Add your first URL above to get started!')).toBeInTheDocument();
    });
  });
}); 