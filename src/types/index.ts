export type UserRole = 'veterinarian' | 'zootechnician' | 'administrator';

export enum SpeciesType {
    CANINE = "canine",
    FELINE = "feline",
    BOVINE = "bovine",
    CAPRINE = "caprine",
    EQUINE = "equine",
    POULTRY = "poultry",
    PIG = "pig"
}

export enum AnimalType {
    URBAN = "urban",
    RURAL = "rural"
}

export enum Gender {
    MALE = "male",
    FEMALE = "female" 
}

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
  species: SpeciesType;
  animalType: AnimalType;
  breed: string;
  gender: Gender;
  birthDate: string;
  color: string;
  ownerId: string;
  owner?: Owner;
}

export interface ApiError {
  error?: string;
  errors?: string[];
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface SignupData {
  username: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface AnimalInput {
  name: string;
  species: SpeciesType | string;
  animalType: AnimalType | string;
  breed: string;
  gender: Gender | string;
  birthDate: string;
  color: string;
  ownerId: string;
}

export interface OwnerInput {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  ownerType: string;
}
