// API service utility with JWT support
const API_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('iujo_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Error al interpretar respuesta del servidor.'
  }));

  if (!response.ok) {
    if (response.status === 401) {
      // If unauthorized, clear token if expired
      if (endpoint !== '/auth/login' && !endpoint.startsWith('/auth/demo')) {
        localStorage.removeItem('iujo_token');
        localStorage.removeItem('iujo_user');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    const error = new Error(data.message || 'Error en la petición');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication endpoints
export const authApi = {
  login: (cedula, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ cedula, password })
  }),
  me: () => apiRequest('/auth/me'),
  demoLogin: (role) => apiRequest(`/auth/demo/${role}`)
};

// Student endpoints
export const studentApi = {
  getSubjects: (periodo = '2-2026') => apiRequest(`/estudiante/materias?periodo=${periodo}`),
  getSectionForEvaluation: (seccionId) => apiRequest(`/estudiante/seccion/${seccionId}/evaluar`),
};

// Evaluation submission (anonymous)
export const evaluationApi = {
  submit: (seccionId, answers, observaciones) => apiRequest('/evaluacion/submit', {
    method: 'POST',
    body: JSON.stringify({ seccionId, answers, observaciones })
  })
};

// Statistics and reports
export const statsApi = {
  getFilters: () => apiRequest('/estadisticas/filtros'),
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/estadisticas?${query}`);
  }
};

// Admin endpoints
export const adminApi = {
  getSummary: () => apiRequest('/admin/summary'),
  getSections: () => apiRequest('/admin/secciones')
};
