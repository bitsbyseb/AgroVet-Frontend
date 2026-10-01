import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyAnimalsView from '../../pages/owner/MyAnimalsView';
import * as ownerServiceModule from '../../services/ownerService';
import type { OwnerAnimal } from '../../types';

vi.mock('../../services/ownerService');

describe('MyAnimalsView Component Tests', () => {
  const mockAnimals: OwnerAnimal[] = [
    {
      id: 'animal-1',
      name: 'Firulais',
      species: 'canine',
      animalType: 'urban',
      breed: 'Golden Retriever',
      gender: 'male',
      birthDate: '2021-05-10T00:00:00.000Z',
      status: 'active',
      color: 'Dorado',
      ownerId: 'owner-1',
      paddockId: null,
    },
    {
      id: 'animal-2',
      name: 'Misi',
      species: 'feline',
      animalType: 'urban',
      breed: 'Siamés',
      gender: 'female',
      birthDate: '2020-02-20T00:00:00.000Z',
      status: 'inactive',
      color: 'Blanco y café',
      ownerId: 'owner-1',
      paddockId: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar las tarjetas con toda la información básica y el badge de estado', async () => {
    vi.spyOn(ownerServiceModule, 'getOwnerAnimals').mockResolvedValue(mockAnimals);

    render(<MyAnimalsView />);

    // Título de la vista
    expect(await screen.findByText('Mis Animales')).toBeInTheDocument();

    // Nombres de los animales
    expect(screen.getByText('Firulais')).toBeInTheDocument();
    expect(screen.getByText('Misi')).toBeInTheDocument();

    // Información básica visible
    expect(screen.getByText('Canino')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Macho')).toBeInTheDocument();
    expect(screen.getByText('Dorado')).toBeInTheDocument();

    expect(screen.getByText('Felino')).toBeInTheDocument();
    expect(screen.getByText('Siamés')).toBeInTheDocument();
    expect(screen.getByText('Hembra')).toBeInTheDocument();
    expect(screen.getByText('Blanco y café')).toBeInTheDocument();

    // Badges de estado de salud
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();

    // Botones de acción "Ver historia clínica"
    const historyButtons = screen.getAllByRole('button', {
      name: /ver historia clínica/i,
    });
    expect(historyButtons).toHaveLength(2);
  });

  it('debería abrir el modal de historia clínica al hacer clic en el botón de la tarjeta', async () => {
    vi.spyOn(ownerServiceModule, 'getOwnerAnimals').mockResolvedValue(mockAnimals);
    vi.spyOn(ownerServiceModule, 'getOwnerAnimalMedicalHistory').mockResolvedValue([]);

    render(<MyAnimalsView />);

    const historyButtons = await screen.findAllByRole('button', {
      name: /ver historia clínica/i,
    });

    await userEvent.click(historyButtons[0]);

    // El modal debe abrirse mostrando el título y el nombre del animal seleccionado
    expect(await screen.findByText('Historia Clínica')).toBeInTheDocument();
    expect(screen.getByText('Solo Lectura')).toBeInTheDocument();
  });

  it('debería mostrar mensaje amigable de lista vacía si no tiene animales registrados', async () => {
    vi.spyOn(ownerServiceModule, 'getOwnerAnimals').mockResolvedValue([]);

    render(<MyAnimalsView />);

    expect(
      await screen.findByText(/No tienes animales registrados aún/i)
    ).toBeInTheDocument();
  });

  it('debería filtrar animales al escribir en la barra de búsqueda', async () => {
    vi.spyOn(ownerServiceModule, 'getOwnerAnimals').mockResolvedValue(mockAnimals);

    render(<MyAnimalsView />);

    await screen.findByText('Firulais');

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await userEvent.type(searchInput, 'Misi');

    expect(screen.queryByText('Firulais')).not.toBeInTheDocument();
    expect(screen.getByText('Misi')).toBeInTheDocument();
  });
});
