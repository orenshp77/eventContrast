import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// Response interceptor
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

export default api;

// API helper functions
export const eventsApi = {
  getAll: () => api.get('/events'),
  getOne: (id: number) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: number, data: any) => api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
};

export const invitesApi = {
  getByEvent: (eventId: number) => api.get(`/invites/event/${eventId}`),
  getOne: (id: number) => api.get(`/invites/${id}`),
  create: (eventId: number, data: any) => api.post(`/invites/event/${eventId}`, data),
  update: (id: number, data: any) => api.put(`/invites/${id}`, data),
  updateStatus: (id: number, status: string) => api.put(`/invites/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/invites/${id}`),
};

export const publicApi = {
  getInvite: (token: string) => api.get(`/public/invite/${token}`),
  submitInvite: (token: string, data: any) => api.post(`/public/invite/${token}/submit`, data),
  sendEmail: (token: string, email: string) => api.post(`/public/invite/${token}/send-email`, { recipientEmail: email }),
};
