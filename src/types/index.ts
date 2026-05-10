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
  status: 'active' | 'inactive';
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

export interface AnimalUpdateInput {
  name?: string;
  color?: string;
  breed?: string;
  status?: 'active' | 'inactive';
}

export interface MedicalHistoryRecord {
  id: string;
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  observations?: string;
  animalId: string;
  professionalId: string;
  professional?: {
    username: string;
    role: string;
  };
}

export interface MedicalHistoryInput {
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  observations?: string;
}

export interface VaccineRecord {
  id: string;
  vaccineName: string;
  applicationDate: string;
  nextDoseDate?: string;
  batchNumber?: string;
  animalId: string;
  administeredById: string;
  administeredBy?: {
    username: string;
    role: string;
  };
}

export interface VaccineInput {
  vaccineName: string;
  applicationDate: string;
  nextDoseDate?: string;
  batchNumber?: string;
}

export interface OwnerInput {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  ownerType: string;
}

export interface OwnerUpdateInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownerType?: string;
}
