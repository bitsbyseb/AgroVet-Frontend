import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { User, AuthResponse, LoginCredentials, SignupData, AnimalInput, OwnerInput, Animal, Owner } from '../types';

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
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  signup: async (userData: SignupData): Promise<void> => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  getCurrentUser: (): User | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded = jwtDecode<any>(token);
      // Aseguramos que el rol esté en minúsculas para evitar problemas de case-sensitivity
      if (decoded && decoded.role) {
        decoded.role = decoded.role.toLowerCase();
      }
      return decoded as User;
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
  list: async (): Promise<Animal[]> => {
    const response = await api.get<Animal[]>('/animals');
    return response.data;
  },
  create: async (animalData: AnimalInput): Promise<Animal> => {
    const response = await api.post<Animal>('/animals', animalData);
    return response.data;
  },
};

export const ownerService = {
  list: async (): Promise<Owner[]> => {
    const response = await api.get<Owner[]>('/owners');
    return response.data;
  },
  create: async (ownerData: OwnerInput): Promise<Owner> => {
    const response = await api.post<Owner>('/owners', ownerData);
    return response.data;
  },
};

export default api;
