import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me')
};

// Users (admin)
export const usersApi = {
  list:   ()         => api.get('/users'),
  create: (data)     => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id)       => api.delete(`/users/${id}`)
};

// Courses
export const coursesApi = {
  list:   ()     => api.get('/courses'),
  get:    (id)   => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  remove: (id)   => api.delete(`/courses/${id}`),

  uploadVideo: (id, formData, onProgress) =>
    api.post(`/courses/${id}/upload-video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
      onUploadProgress: onProgress
    }),

  uploadPresentation: (id, formData, onProgress) =>
    api.post(`/courses/${id}/upload-presentation`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
      onUploadProgress: onProgress
    }),

  getPresentationToken: (id) => api.get(`/courses/${id}/presentation-token`),
  completeMaterial: (id) => api.post(`/courses/${id}/complete`),

  videoUrl:        (id) => `/api/courses/${id}/video`,
  presentationUrl: (id) => `/api/courses/${id}/presentation`
};

// Questions (admin)
export const questionsApi = {
  add:          (courseId, data) => api.post(`/questions/course/${courseId}`, data),
  update:       (id, data)       => api.put(`/questions/${id}`, data),
  remove:       (id)             => api.delete(`/questions/${id}`),
  addOption:    (qId, data)      => api.post(`/questions/${qId}/options`, data),
  updateOption: (id, data)       => api.put(`/questions/options/${id}`, data),
  removeOption: (id)             => api.delete(`/questions/options/${id}`)
};

// Quiz / Reports
export const reportsApi = {
  submitQuiz:      (courseId, answers) => api.post(`/reports/courses/${courseId}/quiz/submit`, { answers }),
  getCourseAttempts: (courseId)        => api.get(`/reports/courses/${courseId}/attempts`),
  myGrades:        ()                  => api.get('/reports/my-grades'),
  allGrades:       ()                  => api.get('/reports/grades'),
  stats:           ()                  => api.get('/reports/stats')
};

// Certificates
export const certificatesApi = {
  list:     ()    => api.get('/certificates'),
  download: (id)  => `/api/certificates/${id}/download`
};

export default api;
