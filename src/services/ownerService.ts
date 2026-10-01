import api from './api';
import type { OwnerAnimal, OwnerMedicalHistoryEntry } from '../types';

/**
 * Obtiene la lista de animales pertenecientes al propietario autenticado.
 * El backend extrae el userId del token JWT.
 */
export const getOwnerAnimals = async (): Promise<OwnerAnimal[]> => {
  const response = await api.get<OwnerAnimal[]>('/owner/animals');
  return response.data;
};

/**
 * Obtiene la historia clínica completa de un animal perteneciente al propietario autenticado.
 * Es una operación estrictamente de lectura.
 * @param animalId Identificador UUID del animal
 */
export const getOwnerAnimalMedicalHistory = async (animalId: string): Promise<OwnerMedicalHistoryEntry[]> => {
  const response = await api.get<OwnerMedicalHistoryEntry[]>(`/owner/animals/${animalId}/medical-history`);
  return response.data;
};

export const ownerService = {
  getOwnerAnimals,
  getOwnerAnimalMedicalHistory,
};

export default ownerService;
