import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { getOwnerAnimals, getOwnerAnimalMedicalHistory } from '../../services/ownerService';
import type { OwnerAnimal, OwnerMedicalHistoryEntry } from '../../types';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('ownerService API Tests (Sprint 11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOwnerAnimals debería solicitar GET /owner/animals y retornar los datos', async () => {
    const mockAnimals: OwnerAnimal[] = [
      {
        id: 'animal-1',
        name: 'Bessie',
        species: 'bovine',
        animalType: 'rural',
        breed: 'Holstein',
        gender: 'female',
        birthDate: '2022-01-15T00:00:00.000Z',
        status: 'active',
        color: 'Blanco y Negro',
        ownerId: 'owner-1',
        paddockId: null,
      },
    ];

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockAnimals });

    const result = await getOwnerAnimals();

    expect(api.get).toHaveBeenCalledWith('/owner/animals');
    expect(result).toEqual(mockAnimals);
  });

  it('getOwnerAnimalMedicalHistory debería solicitar GET /owner/animals/:id/medical-history', async () => {
    const animalId = 'animal-123';
    const mockHistory: OwnerMedicalHistoryEntry[] = [
      {
        id: 'hist-1',
        animalId,
        date: '2024-03-15T00:00:00.000Z',
        reason: 'Revisión periódica',
        diagnosis: 'Animal sano',
        treatment: 'Vitaminas',
        observations: 'Buen estado',
        createdBy: 'vet-1',
      },
    ];

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockHistory });

    const result = await getOwnerAnimalMedicalHistory(animalId);

    expect(api.get).toHaveBeenCalledWith(`/owner/animals/${animalId}/medical-history`);
    expect(result).toEqual(mockHistory);
  });
});
