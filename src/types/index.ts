export type UserRole = 'veterinarian' | 'zootechnician' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
}

export interface Owner {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  ownerType: 'urban' | 'rural';
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  ownerId: string;
  owner?: Owner;
}

export interface ApiError {
  error?: string;
  errors?: string[];
}
