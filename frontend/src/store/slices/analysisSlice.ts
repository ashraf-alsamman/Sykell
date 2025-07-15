import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';

interface Analysis {
  id: number;
  url: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface AnalysisState {
  analyses: Analysis[];
  currentAnalysis: Analysis | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalysisState = {
  analyses: [],
  currentAnalysis: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAnalyses = createAsyncThunk(
  'analysis/fetchAnalyses',
  async (params: { page?: number; pageSize?: number; status?: string; search?: string }) => {
    const response = await apiService.getURLs(params);
    return response;
  }
);

export const fetchAnalysis = createAsyncThunk(
  'analysis/fetchAnalysis',
  async (id: string) => {
    const response = await apiService.getAnalysis(parseInt(id));
    return response;
  }
);

export const createAnalysis = createAsyncThunk(
  'analysis/createAnalysis',
  async (url: string) => {
    const response = await apiService.createURL(url);
    return response;
  }
);

export const bulkDeleteAnalyses = createAsyncThunk(
  'analysis/bulkDeleteAnalyses',
  async (ids: number[], { dispatch }) => {
    await apiService.bulkDeleteURLs(ids);
    // Refetch analyses after deletion
    dispatch(fetchAnalyses({}));
    return ids;
  }
);

export const bulkRerunAnalyses = createAsyncThunk(
  'analysis/bulkRerunAnalyses',
  async (ids: number[], { dispatch }) => {
    await apiService.bulkRerunURLs(ids);
    // Refetch analyses after rerun
    dispatch(fetchAnalyses({}));
    return ids;
  }
);

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearCurrentAnalysis: (state) => {
      state.currentAnalysis = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAnalysis: (state, action: PayloadAction<Analysis>) => {
      const index = state.analyses.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.analyses[index] = action.payload;
      }
      if (state.currentAnalysis?.id === action.payload.id) {
        state.currentAnalysis = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Analyses
    builder
      .addCase(fetchAnalyses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalyses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analyses = action.payload.urls;
        state.error = null;
      })
      .addCase(fetchAnalyses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load analyses';
      });

    // Fetch Single Analysis
    builder
      .addCase(fetchAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        // Convert the response to match our Analysis type
        const analysis = {
          id: action.payload.url.id,
          url: action.payload.url.url,
          status: action.payload.url.status,
          created_at: action.payload.url.created_at,
          updated_at: action.payload.url.updated_at,
          started_at: action.payload.url.started_at,
          completed_at: action.payload.url.completed_at,
          error_message: action.payload.url.error_message,
        };
        state.currentAnalysis = analysis;
        state.error = null;
      })
      .addCase(fetchAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load analysis';
      });

    // Create Analysis
    builder
      .addCase(createAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analyses.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create analysis';
      });

    // Bulk Delete Analyses
    builder
      .addCase(bulkDeleteAnalyses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkDeleteAnalyses.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(bulkDeleteAnalyses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete analyses';
      });

    // Bulk Rerun Analyses
    builder
      .addCase(bulkRerunAnalyses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkRerunAnalyses.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(bulkRerunAnalyses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to rerun analyses';
      });
  },
});

export const {
  clearCurrentAnalysis,
  clearError,
  updateAnalysis,
} = analysisSlice.actions;

export default analysisSlice.reducer; 