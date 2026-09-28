import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GrazingHistoryFilters } from '../../components/Grazing/GrazingHistoryFilters';
import { GrazingHistoryTable } from '../../components/Grazing/GrazingHistoryTable';
import type { IPaddock, Animal, IGrazingHistoryItem } from '../../types';
import { SpeciesType, AnimalType, Gender } from '../../types';

describe('GrazingHistoryFilters Component Tests', () => {
  const mockPaddocks: IPaddock[] = [
    { id: 'pad-1', name: 'Potrero Norte', capacity: 20, status: 'ACTIVE' },
    { id: 'pad-2', name: 'Potrero Sur', capacity: 15, status: 'RESTING' }
  ];

  const mockAnimals: Animal[] = [
    {
      id: 'anim-1',
      name: 'Vaca Lola',
      species: SpeciesType.BOVINE,
      animalType: AnimalType.RURAL,
      breed: 'Holstein',
      gender: Gender.FEMALE,
      birthDate: '2024-01-01',
      color: 'Blanco y Negro',
      ownerId: 'owner-1',
      status: 'active'
    }
  ];

  it('renders all filter inputs and selects', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <GrazingHistoryFilters
        filters={{ paddockId: 'ALL', animalId: 'ALL', startDate: '', endDate: '' }}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        paddocks={mockPaddocks}
        animals={mockAnimals}
      />
    );

    expect(screen.getByText('Filtros de Búsqueda')).toBeInTheDocument();
    expect(screen.getByText('Todos los potreros')).toBeInTheDocument();
    expect(screen.getByText('Potrero Norte (Cap: 20)')).toBeInTheDocument();
    expect(screen.getByText('Todos los animales')).toBeInTheDocument();
    expect(screen.getByText('Vaca Lola - Holstein')).toBeInTheDocument();
  });

  it('calls onFilterChange when selecting a paddock', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <GrazingHistoryFilters
        filters={{ paddockId: 'ALL', animalId: 'ALL', startDate: '', endDate: '' }}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        paddocks={mockPaddocks}
        animals={mockAnimals}
      />
    );

    const paddockSelect = screen.getByRole('combobox', { name: /potrero/i });
    fireEvent.change(paddockSelect, { target: { value: 'pad-1' } });

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ paddockId: 'pad-1' })
    );
  });

  it('shows and calls onReset when active filters exist', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <GrazingHistoryFilters
        filters={{ paddockId: 'pad-1', animalId: 'ALL', startDate: '2026-03-01', endDate: '' }}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        paddocks={mockPaddocks}
        animals={mockAnimals}
      />
    );

    expect(screen.getByText('Filtros activos')).toBeInTheDocument();
    const resetButton = screen.getByRole('button', { name: /limpiar filtros/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});

describe('GrazingHistoryTable Component Tests', () => {
  const mockPaddocks: IPaddock[] = [
    { id: 'pad-1', name: 'Potrero Principal', capacity: 30, status: 'ACTIVE' }
  ];

  const mockAnimals: Animal[] = [
    {
      id: 'anim-1',
      name: 'Toro Relámpago',
      species: SpeciesType.BOVINE,
      animalType: AnimalType.RURAL,
      breed: 'Brahman',
      gender: Gender.MALE,
      birthDate: '2023-05-10',
      color: 'Gris',
      ownerId: 'owner-1',
      status: 'active'
    }
  ];

  const mockItems: IGrazingHistoryItem[] = [
    {
      id: 'hist-1',
      paddockId: 'pad-1',
      animalIds: ['anim-1'],
      entryDate: '2026-03-01T08:00:00.000Z',
      exitDate: '2026-03-04T14:00:00.000Z',
      rotationNumber: 3,
      observations: 'Excelente disponibilidad de pasto',
      permanenceTime: {
        days: 3,
        hours: 6,
        totalHours: 78,
        inProgress: false,
        formatted: '3 días, 6 horas'
      }
    },
    {
      id: 'hist-2',
      paddockId: 'pad-1',
      animalIds: ['anim-1'],
      entryDate: '2026-03-10T08:00:00.000Z',
      exitDate: null,
      rotationNumber: 4,
      observations: null,
      permanenceTime: {
        days: 1,
        hours: 2,
        totalHours: 26,
        inProgress: true,
        formatted: '1 día, 2 horas (en curso)'
      }
    }
  ];

  it('renders loading state correctly', () => {
    render(
      <GrazingHistoryTable
        items={[]}
        paddocks={[]}
        animals={[]}
        isLoading={true}
        error={null}
      />
    );

    expect(screen.getByText('Cargando historial de pastoreo...')).toBeInTheDocument();
  });

  it('renders error state and handles retry', () => {
    const handleRetry = vi.fn();

    render(
      <GrazingHistoryTable
        items={[]}
        paddocks={[]}
        animals={[]}
        isLoading={false}
        error="Fallo al conectar con el servidor"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText('Error al cargar el historial')).toBeInTheDocument();
    expect(screen.getByText('Fallo al conectar con el servidor')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty list state when no records are returned', () => {
    render(
      <GrazingHistoryTable
        items={[]}
        paddocks={[]}
        animals={[]}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText('No se encontraron actividades')).toBeInTheDocument();
  });

  it('renders table rows with paddock, status badges and calculated permanence time', () => {
    const handleSelect = vi.fn();

    render(
      <GrazingHistoryTable
        items={mockItems}
        paddocks={mockPaddocks}
        animals={mockAnimals}
        isLoading={false}
        error={null}
        onSelectRecord={handleSelect}
      />
    );

    // Potrero
    expect(screen.getAllByText('Potrero Principal').length).toBe(2);

    // Rotaciones
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();

    // Permanencia calculada
    expect(screen.getByText('3 días, 6 horas')).toBeInTheDocument();
    expect(screen.getByText('1 día, 2 horas (en curso)')).toBeInTheDocument();

    // Badge de "En curso"
    expect(screen.getByText('En curso')).toBeInTheDocument();

    // Observaciones
    expect(screen.getByText('Excelente disponibilidad de pasto')).toBeInTheDocument();
    expect(screen.getByText('Sin observaciones')).toBeInTheDocument();

    // Acciones
    const viewButtons = screen.getAllByTitle('Ver detalle del registro');
    expect(viewButtons.length).toBe(2);
    fireEvent.click(viewButtons[0]);
    expect(handleSelect).toHaveBeenCalledWith(mockItems[0]);
  });
});
