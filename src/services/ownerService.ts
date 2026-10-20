import api from './api';
import type { OwnerAnimal, OwnerMedicalHistoryEntry, OwnerReminderDTO } from '../types';

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

/**
 * Obtiene los recordatorios unificados (vacunas, citas, alimentación) del propietario autenticado.
 * Soporta filtro opcional por animalId (ASIDGA-174 / ASIDGA-175).
 * @param animalId UUID opcional del animal
 */
export const getOwnerReminders = async (animalId?: string): Promise<OwnerReminderDTO[]> => {
  const params: Record<string, string> = {};
  if (animalId && animalId.trim() !== '' && animalId !== 'ALL') {
    params.animalId = animalId;
  }
  const response = await api.get<OwnerReminderDTO[]>('/owner/reminders', { params });
  return response.data;
};

export const ownerService = {
  getOwnerAnimals,
  getOwnerAnimalMedicalHistory,
  getOwnerReminders,
};

export default ownerService;

