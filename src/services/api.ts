import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { User, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si obtenemos un 401 pero la petición fue para iniciar sesión, no recargamos la página
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  signup: async (userData: any): Promise<any> => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  getCurrentUser: (): User | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return jwtDecode<User>(token);
    } catch {
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
};

export const animalService = {
  list: async () => {
    const response = await api.get('/animals');
    return response.data;
  },
  create: async (animalData: any) => {
    const response = await api.post('/animals', animalData);
    return response.data;
  },
};

export const ownerService = {
  list: async () => {
    const response = await api.get('/owners');
    return response.data;
  },
  create: async (ownerData: any) => {
    const response = await api.post('/owners', ownerData);
    return response.data;
  },
};

export default api;
