import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Dashboard from '../../pages/Dashboard';
import { authService, adminService } from '../../services/api';
import type { AdminIndicators } from '../../types';

vi.mock('../../services/api', () => ({
  authService: {
    getCurrentUser: vi.fn()
  },
  adminService: {
    getIndicators: vi.fn()
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { username?: string; defaultValue?: string }) => {
      const dict: Record<string, string> = {
        'dashboard.adminTitle': 'Panel de Administración',
        'dashboard.adminSubtitle': 'Métricas globales del sistema, resumen de usuarios, especies y actividades recientes.',
        'dashboard.welcome': `Bienvenido, ${options?.username || ''}`,
        'dashboard.subtitle': 'Panel de control general de AgroVet',
        'dashboard.totalUsers': 'Usuarios Totales',
        'dashboard.totalAnimals': 'Total Animales',
        'dashboard.activeAnimals': 'Activos',
        'dashboard.owners': 'Propietarios',
        'dashboard.recentActivity': 'Actividades Recientes',
        'dashboard.speciesDistribution': 'Distribución por Especie',
        'dashboard.quickActions': 'Acciones Rápidas',
        'dashboard.manageUsers': 'Registrar Personal',
        'dashboard.manageOwners': 'Gestionar Propietarios',
        'dashboard.manageAnimals': 'Gestionar Animales',
        'dashboard.viewAudit': 'Auditoría del Sistema',
        'dashboard.viewAllActivities': 'Ver todas las actividades',
        'dashboard.noRecentActivity': 'No hay actividad reciente para mostrar.',
        'common.refresh': 'Refrescar',
        'dashboard.errorLoading': 'Error al cargar los indicadores administrativos'
      };
      return dict[key] || options?.defaultValue || key;
    },
    i18n: { language: 'es' }
  })
}));

describe('Dashboard Component (HU20 & HU21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar la vista general para usuarios que no son administradores (ej. veterinario)', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 'vet-1',
      username: 'Dr. Lopez',
      email: 'vet@agrovet.com',
      role: 'veterinarian'
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Bienvenido, Dr. Lopez/i)).toBeInTheDocument();
    expect(screen.getByText('Panel de control general de AgroVet')).toBeInTheDocument();
    expect(adminService.getIndicators).not.toHaveBeenCalled();
  });

  it('debería consultar y renderizar los indicadores administrativos para el rol administrator (HU20)', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 'admin-1',
      username: 'Johan Admin',
      email: 'admin@agrovet.com',
      role: 'administrator'
    });

    const mockIndicators: AdminIndicators = {
      overview: {
        totalUsers: 19,
        totalAnimals: 50,
        totalOwners: 12,
        activeAnimals: 42
      },
      usersByRole: {
        administrator: 2,
        veterinarian: 8,
        zootechnician: 9
      },
      animalsBySpecies: {
        bovine: 30,
        equine: 15,
        canine: 5
      },
      recentActivities: [
        {
          id: 'act-1',
          userId: 'u-1',
          userEmail: 'vet@agrovet.com',
          userRole: 'veterinarian',
          action: 'CREATE',
          resource: 'ANIMAL',
          status: 'SUCCESS',
          createdAt: '2026-11-09T14:00:00.000Z'
        }
      ]
    };

    vi.mocked(adminService.getIndicators).mockResolvedValue(mockIndicators);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('19')).toBeInTheDocument(); // totalUsers
      expect(screen.getByText('50')).toBeInTheDocument(); // totalAnimals
      expect(screen.getByText('12')).toBeInTheDocument(); // totalOwners
      expect(screen.getByText(/42 Activos/i)).toBeInTheDocument();
    });

    // Species distribution
    expect(screen.getByText('bovine')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('equine')).toBeInTheDocument();

    // Recent activity feed
    expect(screen.getAllByText('vet@agrovet.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CREATE').length).toBeGreaterThan(0);
  });

  it('debería mostrar mensaje de error si falla la consulta de indicadores', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 'admin-1',
      username: 'Johan Admin',
      email: 'admin@agrovet.com',
      role: 'administrator'
    });

    vi.mocked(adminService.getIndicators).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los indicadores administrativos')).toBeInTheDocument();
    });
  });
});
