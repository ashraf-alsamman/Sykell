import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Types
export interface URL {
  id: number;
  url: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface AnalysisResult {
  id: number;
  url_id: number;
  html_version?: string;
  page_title?: string;
  h1_count: number;
  h2_count: number;
  h3_count: number;
  h4_count: number;
  h5_count: number;
  h6_count: number;
  internal_links_count: number;
  external_links_count: number;
  broken_links_count: number;
  has_login_form: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrokenLink {
  id: number;
  url_id: number;
  link_url: string;
  status_code?: number;
  error_message?: string;
  created_at: string;
}

export interface URLListResponse {
  urls: URL[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AnalysisDetailResponse {
  url: URL;
  analysis: AnalysisResult;
  broken_links: BrokenLink[];
  internal_links: any[];
  external_links: any[];
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CurrentUserResponse {
  user: {
    id: number;
    username: string;
    email?: string;
    created_at: string;
    updated_at: string;
  };
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response: AxiosResponse<CurrentUserResponse> = await this.api.get('/api/auth/me');
    return response.data;
  }

  // URL endpoints
  async getURLs(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  } = {}): Promise<URLListResponse> {
    const response: AxiosResponse<URLListResponse> = await this.api.get('/api/urls', {
      params,
    });
    return response.data;
  }

  async createURL(url: string): Promise<URL> {
    const response: AxiosResponse<URL> = await this.api.post('/api/urls', { url });
    return response.data;
  }

  async updateURLStatus(id: number, status: string): Promise<void> {
    await this.api.put(`/api/urls/${id}/status`, { status });
  }

  async deleteURL(id: number): Promise<void> {
    await this.api.delete(`/api/urls/${id}`);
  }

  async bulkDeleteURLs(ids: number[]): Promise<void> {
    await this.api.post('/api/urls/bulk-delete', { ids });
  }

  async bulkRerunURLs(ids: number[]): Promise<void> {
    await this.api.post('/api/urls/bulk-rerun', { ids });
  }

  // Analysis endpoints
  async getAnalysis(id: number): Promise<AnalysisDetailResponse> {
    const response: AxiosResponse<AnalysisDetailResponse> = await this.api.get(`/api/analysis/${id}`);
    return response.data;
  }

  async getBrokenLinks(id: number): Promise<BrokenLink[]> {
    const response: AxiosResponse<{ broken_links: BrokenLink[] }> = await this.api.get(`/api/analysis/${id}/links`);
    return response.data.broken_links;
  }
}

export const apiService = new ApiService(); 