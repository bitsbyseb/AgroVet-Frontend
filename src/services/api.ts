import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { 
  User, AuthResponse, LoginCredentials, SignupData, 
  AnimalInput, OwnerInput, Animal, Owner, 
  AnimalUpdateInput, OwnerUpdateInput,
  MedicalHistoryRecord, MedicalHistoryInput,
  VaccineRecord, VaccineInput
} from '../types';

const API_BASE_URL = import.meta.env.VITE_SERVICE_URL + "/api/v1";

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
      const decoded = jwtDecode<User>(token);
      // Aseguramos que el rol esté en minúsculas para evitar problemas de case-sensitivity
      if (decoded && decoded.role) {
        decoded.role = decoded.role.toLowerCase() as User['role'];
      }
      return decoded;
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
  getById: async (id: string): Promise<Animal> => {
    const response = await api.get<Animal>(`/animals/${id}`);
    return response.data;
  },
  create: async (animalData: AnimalInput): Promise<Animal> => {
    const response = await api.post<Animal>('/animals', animalData);
    return response.data;
  },
  update: async (id: string, animalData: AnimalUpdateInput): Promise<Animal> => {
    const response = await api.put<Animal>(`/animals/${id}`, animalData);
    return response.data;
  },
  transferOwner: async (id: string, newOwnerId: string): Promise<Animal> => {
    const response = await api.patch<Animal>(`/animals/${id}/transfer`, { newOwnerId });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/animals/${id}`);
  },
  // Sub-routes
  getHistory: async (id: string): Promise<MedicalHistoryRecord[]> => {
    const response = await api.get<MedicalHistoryRecord[]>(`/animals/${id}/history`);
    return response.data;
  },
  addHistory: async (id: string, data: MedicalHistoryInput): Promise<MedicalHistoryRecord> => {
    const response = await api.post<MedicalHistoryRecord>(`/animals/${id}/history`, data);
    return response.data;
  },
  getVaccines: async (id: string): Promise<VaccineRecord[]> => {
    const response = await api.get<VaccineRecord[]>(`/animals/${id}/vaccines`);
    return response.data;
  },
  addVaccine: async (id: string, data: VaccineInput): Promise<VaccineRecord> => {
    const response = await api.post<VaccineRecord>(`/animals/${id}/vaccines`, data);
    return response.data;
  },
};

export const ownerService = {
  list: async (): Promise<Owner[]> => {
    const response = await api.get<Owner[]>('/owners');
    return response.data;
  },
  getById: async (id: string): Promise<Owner> => {
    const response = await api.get<Owner>(`/owners/${id}`);
    return response.data;
  },
  create: async (ownerData: OwnerInput): Promise<Owner> => {
    const response = await api.post<Owner>('/owners', ownerData);
    return response.data;
  },
  update: async (id: string, ownerData: OwnerUpdateInput): Promise<Owner> => {
    const response = await api.put<Owner>(`/owners/${id}`, ownerData);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/owners/${id}`);
  },
  getAnimals: async (id: string): Promise<Animal[]> => {
    const response = await api.get<Animal[]>(`/owners/${id}/animals`);
    return response.data;
  },
};

export default api;
