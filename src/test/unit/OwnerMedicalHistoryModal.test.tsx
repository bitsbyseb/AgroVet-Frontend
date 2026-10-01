import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OwnerMedicalHistoryModal from '../../components/owner/OwnerMedicalHistoryModal';
import * as ownerServiceModule from '../../services/ownerService';
import type { OwnerAnimal, OwnerMedicalHistoryEntry } from '../../types';

vi.mock('../../services/ownerService');

describe('OwnerMedicalHistoryModal Component Tests', () => {
  const mockAnimal: OwnerAnimal = {
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
  };

  const mockHistory: OwnerMedicalHistoryEntry[] = [
    {
      id: 'hist-1',
      animalId: 'animal-1',
      date: '2024-03-15T00:00:00.000Z',
      reason: 'Control rutinario de peso',
      diagnosis: 'Condición corporal óptima',
      treatment: 'Suplemento mineral',
      observations: 'Continuar con pastoreo en potrero 3',
      createdBy: 'vet-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no debería renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <OwnerMedicalHistoryModal
        isOpen={false}
        onClose={vi.fn()}
        animal={mockAnimal}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debería renderizar la información médica en modo solo lectura (sin botones de edición/creación/eliminación)', async () => {
    vi.spyOn(ownerServiceModule, 'getOwnerAnimalMedicalHistory').mockResolvedValue(mockHistory);

    render(
      <OwnerMedicalHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        animal={mockAnimal}
      />
    );

    // Muestra badge de Solo Lectura
    expect(await screen.findByText('Solo Lectura')).toBeInTheDocument();
    expect(screen.getByText('Bessie')).toBeInTheDocument();

    // Muestra los datos del registro médico
    expect(await screen.findByText(/Control rutinario de peso/i)).toBeInTheDocument();
    expect(screen.getByText('Condición corporal óptima')).toBeInTheDocument();
    expect(screen.getByText(/Suplemento mineral/i)).toBeInTheDocument();
    expect(screen.getByText(/Continuar con pastoreo en potrero 3/i)).toBeInTheDocument();

    // RESTRICCIÓN CLAVE: Verificar que NO existan botones de acción mutativa (crear, editar, eliminar)
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /borrar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nuevo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /agregar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
  });

  it('debería mostrar mensaje de lista vacía cuando no hay registros médicos', async () => {
    vi.spyOn(ownerServiceModule, 'getOwnerAnimalMedicalHistory').mockResolvedValue([]);

    render(
      <OwnerMedicalHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        animal={mockAnimal}
      />
    );

    expect(await screen.findByText(/Sin antecedentes médicos/i)).toBeInTheDocument();
  });

  it('debería llamar a onClose al hacer clic en el botón Cerrar', async () => {
    vi.spyOn(ownerServiceModule, 'getOwnerAnimalMedicalHistory').mockResolvedValue([]);
    const handleClose = vi.fn();

    render(
      <OwnerMedicalHistoryModal
        isOpen={true}
        onClose={handleClose}
        animal={mockAnimal}
      />
    );

    const closeButton = await screen.findByTestId('modal-footer-close-btn');
    await userEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
