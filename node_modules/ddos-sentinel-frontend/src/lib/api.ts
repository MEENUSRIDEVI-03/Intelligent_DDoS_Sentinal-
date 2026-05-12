import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  register(email: string, password: string, username: string) {
    return this.client.post('/auth/register', { email, password, username });
  }

  login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  getCurrentUser() {
    return this.client.get('/auth/me');
  }

  // Traffic endpoints
  getTrafficLogs(sourceIp?: string, severity?: string, limit?: number, offset?: number) {
    return this.client.get('/traffic', {
      params: { sourceIp, severity, limit, offset },
    });
  }

  createTrafficLog(data: any) {
    return this.client.post('/traffic', data);
  }

  simulateTraffic(count: number = 10) {
    return this.client.post('/traffic/simulate', { count });
  }

  // Dashboard endpoints
  getDashboardStats() {
    return this.client.get('/dashboard/stats');
  }

  getTrafficTrend() {
    return this.client.get('/dashboard/traffic-trend');
  }

  getSeverityDistribution() {
    return this.client.get('/dashboard/severity-distribution');
  }

  getPredictionDistribution() {
    return this.client.get('/dashboard/prediction-distribution');
  }

  getRecentAlerts() {
    return this.client.get('/dashboard/recent-alerts');
  }

  getActivityLogs() {
    return this.client.get('/dashboard/activity-logs');
  }

  // Alert endpoints
  getAlerts(status?: string, severity?: string, limit?: number, offset?: number) {
    return this.client.get('/alerts', {
      params: { status, severity, limit, offset },
    });
  }

  getAlert(id: string) {
    return this.client.get(`/alerts/${id}`);
  }

  updateAlert(id: string, status: string) {
    return this.client.patch(`/alerts/${id}`, { status });
  }

  createIncident(alertId: string, description: string) {
    return this.client.post(`/alerts/${alertId}/incidents`, { description });
  }

  updateIncident(alertId: string, incidentId: string, data: any) {
    return this.client.patch(`/alerts/${alertId}/incidents/${incidentId}`, data);
  }

  // Report endpoints
  getReports(type?: string, limit?: number, offset?: number) {
    return this.client.get('/reports', {
      params: { type, limit, offset },
    });
  }

  getReport(id: string) {
    return this.client.get(`/reports/${id}`);
  }

  generateTrafficSummaryReport() {
    return this.client.post('/reports/generate/traffic-summary');
  }

  generateSecurityAnalysisReport() {
    return this.client.post('/reports/generate/security-analysis');
  }

  downloadReport(id: string) {
    return this.client.get(`/reports/${id}/download`);
  }

  // Intel endpoints
  analyzeIntel(data: { queryType: 'ip' | 'domain' | 'url'; value: string }) {
    return this.client.post('/intel/analyze', data);
  }
}

export const apiClient = new ApiClient();
