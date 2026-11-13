import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditLogsView } from '../../pages/Audit/AuditLogs';
import { auditService } from '../../services/api';
import type { AuditLogListResponse } from '../../types';

vi.mock('../../services/api', () => ({
  auditService: {
    getLogs: vi.fn()
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        'audit.title': 'Auditoría y Registro de Actividades',
        'audit.subtitle': 'Supervisión de eventos de seguridad, mutaciones de datos y actividad de usuarios del sistema.',
        'audit.kpi.totalEvents': 'Eventos Registrados',
        'audit.kpi.logins': 'Inicios de Sesión',
        'audit.kpi.mutations': 'Creaciones / Modificaciones',
        'audit.kpi.failures': 'Eventos Fallidos',
        'audit.filters.apply': 'Filtrar',
        'audit.filters.reset': 'Limpiar filtros',
        'audit.filters.user': 'Usuario',
        'audit.filters.action': 'Acción',
        'audit.filters.resource': 'Recurso',
        'audit.filters.status': 'Estado',
        'audit.filters.from': 'Fecha inicial',
        'audit.filters.to': 'Fecha final',
        'audit.table.timestamp': 'Fecha y Hora',
        'audit.table.user': 'Usuario',
        'audit.table.action': 'Acción',
        'audit.table.resource': 'Recurso',
        'audit.table.status': 'Estado',
        'audit.table.ip': 'Dirección IP',
        'audit.table.details': 'Detalles',
        'audit.table.noLogs': 'No se encontraron registros de auditoría',
        'audit.actions.LOGIN': 'Inicio de Sesión',
        'audit.actions.CREATE': 'Creación',
        'audit.actions.UPDATE': 'Modificación',
        'audit.actions.DELETE': 'Eliminación',
        'roles.administrator': 'Administrador',
        'roles.veterinarian': 'Veterinario'
      };
      return translations[key] || options?.defaultValue || key;
    },
    i18n: { language: 'es' }
  })
}));

describe('AuditLogsView Component (Sprint 22 - HU18 & HU19)', () => {
  const mockResponse: AuditLogListResponse = {
    logs: [
      {
        id: 'log-1',
        userId: 'user-admin',
        userEmail: 'admin@agrovet.com',
        userRole: 'administrator',
        action: 'LOGIN',
        resource: 'AUTH',
        resourceId: null,
        details: 'Inicio de sesión exitoso',
        ipAddress: '192.168.1.10',
        status: 'SUCCESS',
        createdAt: '2026-11-09T08:30:00.000Z'
      },
      {
        id: 'log-2',
        userId: 'user-vet',
        userEmail: 'vet@agrovet.com',
        userRole: 'veterinarian',
        action: 'CREATE',
        resource: 'ANIMAL',
        resourceId: 'animal-uuid-1',
        details: '{"name":"Vaca Lola"}',
        ipAddress: '192.168.1.15',
        status: 'SUCCESS',
        createdAt: '2026-11-09T09:15:00.000Z'
      }
    ],
    total: 2,
    limit: 20,
    offset: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, stats, and logs table correctly when data is loaded', async () => {
    vi.mocked(auditService.getLogs).mockResolvedValue(mockResponse);

    render(<AuditLogsView />);

    expect(screen.getByText('Auditoría y Registro de Actividades')).toBeInTheDocument();

    // Check that user emails are rendered
    expect(await screen.findByText('admin@agrovet.com')).toBeInTheDocument();
    expect(screen.getByText('vet@agrovet.com')).toBeInTheDocument();

    // Check actions rendered
    expect(screen.getByText('Inicio de Sesión')).toBeInTheDocument();
    expect(screen.getByText('Creación')).toBeInTheDocument();

    // Check resources rendered
    expect(screen.getAllByText('AUTH').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ANIMAL').length).toBeGreaterThan(0);

    // Check IP addresses rendered
    expect(screen.getByText('192.168.1.10')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.15')).toBeInTheDocument();
  });

  it('shows empty state message when no audit logs exist', async () => {
    vi.mocked(auditService.getLogs).mockResolvedValue({
      logs: [],
      total: 0,
      limit: 20,
      offset: 0
    });

    render(<AuditLogsView />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron registros de auditoría')).toBeInTheDocument();
    });
  });

  it('triggers filter query when form is submitted', async () => {
    vi.mocked(auditService.getLogs).mockResolvedValue(mockResponse);

    render(<AuditLogsView />);

    await screen.findByText('admin@agrovet.com');

    const filterButton = screen.getByRole('button', { name: /Filtrar/i });
    await userEvent.click(filterButton);

    expect(auditService.getLogs).toHaveBeenCalled();
  });
});
