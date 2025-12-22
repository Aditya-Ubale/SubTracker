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
    // Check if this is an admin route
    const isAdminRoute = config.url?.includes('/admin/');

    // Use admin token for admin routes, otherwise use regular token
    const token = isAdminRoute
      ? localStorage.getItem('adminToken')
      : localStorage.getItem('token');

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
    // Don't redirect on 401 for auth endpoints or admin endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isAdminEndpoint = error.config?.url?.includes('/admin/');

    if (error.response?.status === 401 && !isAuthEndpoint && !isAdminEndpoint) {
      // Token expired or invalid - only clear and redirect for protected user routes
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

  // Get plans for a specific subscription
  getPlansForSubscription: (subscriptionName) => api.get(`/subscriptions/plans/by-name/${encodeURIComponent(subscriptionName)}`),
  getPlansById: (subscriptionId) => api.get(`/subscriptions/${subscriptionId}/plans`),

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

// ==================== ADMIN APIs ====================
export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  initializeAdmin: () => api.post('/admin/init'),
  triggerScraping: () => api.post('/admin/scrape-prices'),
  checkRenewals: () => api.post('/admin/check-renewals'),
};

// ==================== PAYMENT APIs ====================
export const paymentAPI = {
  // Initiate a new payment
  initiatePayment: (data) => api.post('/payments/initiate', data),
  // Process payment with card/UPI details
  processPayment: (data) => api.post('/payments/process', data),
  // Get payment status
  getPaymentStatus: (transactionId) => api.get(`/payments/status/${transactionId}`),
  // Get payment history
  getPaymentHistory: () => api.get('/payments/history'),
  // Cancel a pending payment
  cancelPayment: (transactionId) => api.post(`/payments/cancel/${transactionId}`),
  // Add free subscription (price = 0)
  addFreeSubscription: (data) => api.post('/payments/add-free', data),
};

// ==================== STRIPE APIs ====================
export const stripeAPI = {
  // Create Stripe Checkout Session
  createCheckoutSession: (data) => api.post('/stripe/create-checkout-session', data),
  // Verify payment after completion
  verifyPayment: (data) => api.post('/stripe/verify', data),
  // Handle payment cancellation
  handleCancel: (data) => api.post('/stripe/cancel', data),
};

export default api;