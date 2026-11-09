import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductionIndicatorsView } from '../../pages/Animals/ProductionIndicatorsView';
import { productionService } from '../../services/api';
import type { ProductionIndicators } from '../../types';

vi.mock('../../services/api', () => ({
  productionService: {
    getIndicators: vi.fn(),
    getByAnimalId: vi.fn(),
    create: vi.fn()
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        'production.indicators.periodFilter': 'Filtro de Período',
        'production.indicators.last30Days': '30 días',
        'production.indicators.last90Days': '90 días',
        'production.indicators.allTime': 'Todo',
        'production.indicators.from': 'Desde',
        'production.indicators.to': 'Hasta',
        'production.indicators.apply': 'Filtrar',
        'production.indicators.summaryTitle': 'Indicadores Agregados del Período',
        'production.indicators.totalRecords': 'Lotes Registrados',
        'production.indicators.avgWeight': 'Peso Promedio',
        'production.indicators.totalWeight': 'Peso Acumulado',
        'production.indicators.avgMilk': 'Promedio Leche / Lote',
        'production.indicators.totalMilk': 'Leche Total Producida',
        'production.indicators.accumulatedWeightGain': 'Ganancia de Peso Acumulada',
        'production.indicators.qualityTitle': 'Distribución por Calidad del Producto',
        'production.indicators.purposeTitle': 'Distribución por Propósito',
        'production.indicators.evolutionTitle': 'Evolución Productiva y Ganancia de Peso',
        'production.indicators.evolutionSubtitle': 'Seguimiento cronológico del incremento ponderal y peso corporal.',
        'production.indicators.noIndicators': 'No se encontraron registros de producción para el período seleccionado.',
        'production.indicators.chartWeight': 'Peso corporal',
        'production.indicators.chartGain': 'Ganancia en lote',
        'production.indicators.chartCumulative': 'Ganancia acumulada',
        'production.display.kg': 'kg',
        'production.display.liters': 'litros'
      };
      return translations[key] || options?.defaultValue || key;
    },
    i18n: { language: 'es' }
  })
}));

describe('ProductionIndicatorsView Component (HU17)', () => {
  const mockIndicators: ProductionIndicators = {
    animalId: 'animal-123',
    period: {
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-11-09T23:59:59.999Z',
      totalRecords: 5,
      totalWeight: 2400,
      avgWeight: 480,
      totalMilkProduction: 100,
      avgMilkProduction: 20,
      totalWeightGain: 12.5,
      qualityDistribution: { Alta: 3, Media: 2 },
      purposeDistribution: { milk: 5 }
    },
    weightGainEvolution: [
      {
        date: '2026-10-01T00:00:00.000Z',
        weight: 470,
        weightGain: 2.5,
        cumulativeWeightGain: 2.5
      },
      {
        date: '2026-10-15T00:00:00.000Z',
        weight: 480,
        weightGain: 10.0,
        cumulativeWeightGain: 12.5
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders period summary metrics and evolution cards when data is loaded', async () => {
    vi.mocked(productionService.getIndicators).mockResolvedValue(mockIndicators);

    render(<ProductionIndicatorsView animalId="animal-123" />);

    // Check loading indicator or resolved metrics
    expect(await screen.findByText('+12.5')).toBeInTheDocument();
    expect(screen.getByText('480')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    // Check quality distribution
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('Media')).toBeInTheDocument();

    // Check evolution cards
    expect(screen.getByText('+2.5 kg acum.')).toBeInTheDocument();
    expect(screen.getByText('+12.5 kg acum.')).toBeInTheDocument();
  });

  it('shows empty state message when totalRecords is 0', async () => {
    vi.mocked(productionService.getIndicators).mockResolvedValue({
      animalId: 'animal-123',
      period: {
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-11-09T23:59:59.999Z',
        totalRecords: 0,
        totalWeight: null,
        avgWeight: null,
        totalMilkProduction: null,
        avgMilkProduction: null,
        totalWeightGain: null,
        qualityDistribution: {},
        purposeDistribution: {}
      },
      weightGainEvolution: []
    });

    render(<ProductionIndicatorsView animalId="animal-123" />);

    await waitFor(() => {
      expect(screen.getByText(/No se encontraron registros de producción/i)).toBeInTheDocument();
    });
  });

  it('calls service with updated date range when preset buttons are clicked', async () => {
    vi.mocked(productionService.getIndicators).mockResolvedValue(mockIndicators);

    render(<ProductionIndicatorsView animalId="animal-123" />);

    await screen.findByText('+12.5');

    const button90 = screen.getByRole('button', { name: /90 días/i });
    await userEvent.click(button90);

    expect(productionService.getIndicators).toHaveBeenCalledTimes(2);
  });
});
