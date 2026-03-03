import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me')
};

// Dimensions & Questions
export const dimensionsAPI = {
  getAll: () => api.get('/dimensions'),
  getQuestionsByDimension: () => api.get('/questions/by-dimension')
};

// Cycles
export const cyclesAPI = {
  getAll: () => api.get('/cycles'),
  getActive: () => api.get('/cycles/active'),
  create: (data) => api.post('/cycles', data)
};

// Assignments
export const assignmentsAPI = {
  getMy: () => api.get('/assignments/my'),
  getAll: () => api.get('/assignments')
};

// Responses
export const responsesAPI = {
  save: (data) => api.post('/responses', data),
  submit: (data) => api.post('/responses/submit', data),
  get: (cycleId, poId) => api.get(`/responses/${cycleId}/${poId}`)
};

// Scorecards
export const scorecardsAPI = {
  getMy: () => api.get('/scorecards/my'),
  get: (poId) => api.get(`/scorecards/${poId}`),
  getAll: (params) => api.get('/scorecards', { params })
};

// Manager
export const managerAPI = {
  getTeam: () => api.get('/manager/team')
};

// Executive
export const executiveAPI = {
  getSummary: (params) => api.get('/executive/summary', { params }),
  getHeatmap: (cycleId) => api.get('/executive/heatmap', { params: { cycle_id: cycleId } })
};

// Admin
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getProductOwners: () => api.get('/admin/product-owners'),
  createDimension: (data) => api.post('/admin/dimensions', data),
  updateDimension: (id, data) => api.put(`/admin/dimensions/${id}`, data),
  createQuestion: (data) => api.post('/admin/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data)
};

// Export
export const exportAPI = {
  csv: (cycleId) => api.get('/export/csv', { params: { cycle_id: cycleId } })
};

// Demo
export const seedDemoData = () => api.post('/seed-demo');

export default api;
