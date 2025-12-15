import axios from 'axios';

// Base URL for API
const API_BASE_URL = 'http://localhost:8084/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for auth endpoints (login, signup, etc.)
    const isAuthEndpoint = error.config?.url?.includes('/auth/');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expired or invalid - only clear and redirect for protected routes
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  getCurrentUser: () => api.get('/auth/me'),
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
};

// ==================== SUBSCRIPTION APIs ====================
export const subscriptionAPI = {
  // Public - Get all available subscriptions
  getAllAvailable: () => api.get('/subscriptions/all'),
  getById: (id) => api.get(`/subscriptions/all/${id}`),
  getByCategory: (category) => api.get(`/subscriptions/all/category/${category}`),

  // User's subscriptions
  getUserSubscriptions: () => api.get('/user-subscriptions'),
  getUserSubscriptionById: (id) => api.get(`/user-subscriptions/${id}`),
  addSubscription: (data) => api.post('/user-subscriptions', data),
  updateSubscription: (id, data) => api.put(`/user-subscriptions/${id}`, data),
  deleteSubscription: (id) => api.delete(`/user-subscriptions/${id}`),
  getUpcomingRenewals: (days = 7) => api.get(`/user-subscriptions/renewals?days=${days}`),
  getMonthlyTotal: () => api.get('/user-subscriptions/total'),
};

// ==================== WATCHLIST APIs ====================
export const watchlistAPI = {
  getWatchlist: () => api.get('/watchlist'),
  addToWatchlist: (data) => api.post('/watchlist', data),
  updateWatchlistItem: (id, data) => api.put(`/watchlist/${id}`, data),
  removeFromWatchlist: (id) => api.delete(`/watchlist/${id}`),
};

// ==================== BUDGET APIs ====================
export const budgetAPI = {
  getBudgetSummary: () => api.get('/budget'),
  updateBudget: (data) => api.post('/budget', data),
  getBudgetHistory: () => api.get('/budget/history'),
};

// ==================== ALERT APIs ====================
export const alertAPI = {
  getAllAlerts: () => api.get('/alerts'),
  getUnreadAlerts: () => api.get('/alerts/unread'),
  getUnreadCount: () => api.get('/alerts/unread/count'),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
};

// ==================== EXPORT APIs ====================
export const exportAPI = {
  exportPdf: () => api.get('/export/pdf', { responseType: 'blob' }),
};

export default api;