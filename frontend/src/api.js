import axios from 'axios';

// URL da API no Render (backend)
const API_URL = process.env.REACT_APP_API_URL || 'https://colaborador-jomz.onrender.com';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
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

export default api;
