import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService, AnalysisDetailResponse } from '../services/apiService';

const AnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('AnalysisDetail component rendered with id:', id);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!id) {
        console.log('No id provided in useEffect');
        return;
      }
      try {
        setLoading(true);
        console.log('Loading analysis for ID:', id);
        const data = await apiService.getAnalysis(parseInt(id));
        console.log('Analysis data received:', data);
        setAnalysis(data);
      } catch (err: any) {
        console.error('Error loading analysis:', err);
        setError(err.response?.data?.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [id]);


  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Analysis Detail Test Page</h1>
      <p><strong>URL ID:</strong> {id || 'No ID'}</p>
      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      <p><strong>Error:</strong> {error || 'None'}</p>
      <p><strong>Analysis Data:</strong> {analysis ? 'Loaded' : 'Not loaded'}</p>
      
      {analysis && (
        <div>
          <h2>Analysis Results:</h2>
          <p><strong>URL:</strong> {analysis.url.url}</p>
          <p><strong>Page Title:</strong> {analysis.analysis.page_title || 'No title'}</p>
          <p><strong>HTML Version:</strong> {analysis.analysis.html_version || 'Unknown'}</p>
          <p><strong>Internal Links:</strong> {analysis.analysis.internal_links_count}</p>
          <p><strong>External Links:</strong> {analysis.analysis.external_links_count}</p>
          <p><strong>Broken Links:</strong> {analysis.analysis.broken_links_count}</p>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AnalysisDetail; 