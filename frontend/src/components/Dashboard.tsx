import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchAnalyses,
  createAnalysis,
  bulkDeleteAnalyses,
  bulkRerunAnalyses
} from '../store/slices/analysisSlice';
import { 
  setUrl, 
  validateUrl, 
  setSubmitting, 
  addRecentUrl,
  clearCurrentUrl 
} from '../store/slices/urlSlice';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { analyses, isLoading, error } = useAppSelector(state => state.analysis);
  const { currentUrl, isValid, isSubmitting, error: urlError } = useAppSelector(state => state.url);
  
  const [selectedUrls, setSelectedUrls] = useState<number[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // Load URLs
  const loadURLs = useCallback(async () => {
    try {
      const response = await dispatch(fetchAnalyses({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
        search: filters.search || undefined,
      })).unwrap();
      
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.total_pages,
      }));
    } catch (error) {
      console.error('Error loading URLs:', error);
    }
  }, [dispatch, pagination.page, pagination.pageSize, filters.status, filters.search]);

  // Load URLs on component mount and when filters/pagination change
  useEffect(() => {
    loadURLs();
  }, [loadURLs]);

  // Auto-refresh every 10 seconds to show real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        loadURLs();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoading, loadURLs]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUrl.trim()) return;

    try {
      dispatch(setSubmitting(true));
      await dispatch(createAnalysis(currentUrl)).unwrap();
      dispatch(addRecentUrl(currentUrl));
      dispatch(clearCurrentUrl());
      loadURLs();
    } catch (error) {
      console.error('Failed to create analysis:', error);
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    dispatch(setUrl(url));
    
    // Basic URL validation
    try {
      new URL(url);
      dispatch(validateUrl(true));
    } catch {
      dispatch(validateUrl(false));
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedUrls.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedUrls.length} URL(s)?`)) {
      return;
    }

    try {
      await dispatch(bulkDeleteAnalyses(selectedUrls)).unwrap();
      setSelectedUrls([]);
    } catch (error) {
      console.error('Failed to delete analyses:', error);
    }
  };

  const handleBulkRerun = async () => {
    if (selectedUrls.length === 0) return;

    try {
      await dispatch(bulkRerunAnalyses(selectedUrls)).unwrap();
      setSelectedUrls([]);
    } catch (error) {
      console.error('Failed to rerun analyses:', error);
    }
  };

  // Handle checkbox selection
  const handleSelectAll = (checked: boolean) => {
    if (checked && analyses) {
      setSelectedUrls(analyses.map(url => url.id));
    } else {
      setSelectedUrls([]);
    }
  };

  const handleSelectUrl = (urlId: number, checked: boolean) => {
    if (checked) {
      setSelectedUrls(prev => [...prev, urlId]);
    } else {
      setSelectedUrls(prev => prev.filter(id => id !== urlId));
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'running':
        return 'badge-warning';
      case 'failed':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading && (!analyses || analyses.length === 0)) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading URLs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">URL Dashboard</h1>
          
          <form onSubmit={handleSubmit} className="add-url-form">
            <div className="form-group">
              <label htmlFor="newUrl" className="form-label">
                Add New URL
              </label>
              <input
                type="url"
                id="newUrl"
                className="form-control"
                placeholder="https://example.com"
                value={currentUrl}
                onChange={handleUrlChange}
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !isValid || !currentUrl.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add URL'}
            </button>
          </form>
        </div>

        {(error || urlError) && (
          <div className="alert alert-danger">
            {error || urlError}
          </div>
        )}

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="searchFilter">Search</label>
            <input
              type="text"
              id="searchFilter"
              className="form-control"
              placeholder="Search URLs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUrls.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger"
              style={{ marginRight: '0.5rem' }}
            >
              Delete Selected ({selectedUrls.length})
            </button>
            <button
              onClick={handleBulkRerun}
              className="btn btn-success"
            >
              Rerun Selected ({selectedUrls.length})
            </button>
          </div>
        )}

        {/* URLs Table */}
        <div className="url-table-container">
          {!analyses || analyses.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              <p>No URLs found. Add your first URL above to get started!</p>
            </div>
          ) : (
            <table className="url-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedUrls.length === (analyses?.length || 0) && (analyses?.length || 0) > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((url) => (
                  <tr key={url.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUrls.includes(url.id)}
                        onChange={(e) => handleSelectUrl(url.id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <a href={url.url} target="_blank" rel="noopener noreferrer">
                        {url.url}
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(url.status)}`}>
                        {url.status}
                      </span>
                    </td>
                    <td>{formatDate(url.created_at)}</td>
                    <td>
                      <div className="url-actions">
                        {url.status === 'completed' && (
                          <Link
                            to={`/analysis/${url.id}`}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            View Analysis
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={page === pagination.page ? 'current' : ''}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Summary */}
        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
          Showing {analyses?.length || 0} of {pagination.total} URLs
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 