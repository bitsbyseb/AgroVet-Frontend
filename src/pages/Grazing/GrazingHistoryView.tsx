import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import {
  grazingService,
  paddockService,
  animalService
} from '../../services/api';
import type {
  IGrazingHistoryItem,
  IPaddock,
  Animal,
  GrazingHistoryFilters as FiltersType
} from '../../types';
import { GrazingHistoryFilters } from '../../components/Grazing/GrazingHistoryFilters';
import { GrazingHistoryTable } from '../../components/Grazing/GrazingHistoryTable';
import {
  Compass,
  ArrowLeft,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
  Users,
  X,
  FileText
} from 'lucide-react';

export const GrazingHistoryView: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<IGrazingHistoryItem[]>([]);
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FiltersType>({
    paddockId: 'ALL',
    animalId: 'ALL',
    startDate: '',
    endDate: ''
  });

  // Modal Detail State
  const [selectedRecord, setSelectedRecord] = useState<IGrazingHistoryItem | null>(null);

  // Carga de catálogos base (Potreros y Animales)
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [paddocksData, animalsData] = await Promise.all([
          paddockService.getPaddocks().catch(() => [] as IPaddock[]),
          animalService.list().catch(() => [] as Animal[])
        ]);
        setPaddocks(paddocksData);
        setAnimals(animalsData);
      } catch (err) {
        console.error('Error cargando catálogos de potreros y animales:', err);
      }
    };
    fetchCatalogs();
  }, []);

  // Consulta de historial con filtros
  const fetchHistory = useCallback(async (currentFilters: FiltersType) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await grazingService.getGrazingHistory(currentFilters);
      setHistoryItems(data);
    } catch (err: unknown) {
      console.error('Error obteniendo historial de pastoreo:', err);
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'No se pudo cargar el historial de pastoreo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto que actualiza la consulta automáticamente al cambiar los filtros
  useEffect(() => {
    fetchHistory(filters);
  }, [filters, fetchHistory]);

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      paddockId: 'ALL',
      animalId: 'ALL',
      startDate: '',
      endDate: ''
    });
  };

  // Mapeos rápidos para el modal de detalle
  const paddockMap = useMemo(() => {
    const map = new Map<string, IPaddock>();
    paddocks.forEach((p) => map.set(p.id, p));
    return map;
  }, [paddocks]);

  const animalMap = useMemo(() => {
    const map = new Map<string, Animal>();
    animals.forEach((a) => map.set(a.id, a));
    return map;
  }, [animals]);

  // Métricas de resumen
  const stats = useMemo(() => {
    const total = historyItems.length;
    const inProgress = historyItems.filter((i) => i.permanenceTime?.inProgress || !i.exitDate).length;
    const completed = total - inProgress;
    const uniqueAnimals = new Set(historyItems.flatMap((i) => i.animalIds || [])).size;

    return { total, inProgress, completed, uniqueAnimals };
  }, [historyItems]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/grazing" className="hover:text-emerald-700 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Pastoreo</span>
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Historial</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-7 h-7 text-emerald-700" />
            Historial de Pastoreo
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Trazabilidad completa de ocupación y cálculo dinámico de permanencia en potreros
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchHistory(filters)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium border border-gray-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <Link
            to="/grazing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Rotaciones Activas</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 font-medium">Rotaciones Filtradas</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
              <div className="text-xs text-gray-500 font-medium">Rotaciones En Curso</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
              <div className="text-xs text-gray-500 font-medium">Rotaciones Finalizadas</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.uniqueAnimals}</div>
              <div className="text-xs text-gray-500 font-medium">Animales Participantes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de Filtros Responsivo */}
      <GrazingHistoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        paddocks={paddocks}
        animals={animals}
        isLoading={isLoading}
      />

      {/* Tabla de Historial con Estados de Carga, Error y Vacío */}
      <GrazingHistoryTable
        items={historyItems}
        paddocks={paddocks}
        animals={animals}
        isLoading={isLoading}
        error={error}
        onRetry={() => fetchHistory(filters)}
        onSelectRecord={(record) => setSelectedRecord(record)}
      />

      {/* Modal de Detalle de Rotación */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-gray-900 text-lg">
                  Detalle de Rotación #{selectedRecord.rotationNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Potrero */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Potrero</div>
                    <div className="text-base font-bold text-gray-900">
                      {paddockMap.get(selectedRecord.paddockId)?.name || 'Potrero desconocido'}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  Capacidad: <b>{paddockMap.get(selectedRecord.paddockId)?.capacity || 'N/A'}</b>
                </div>
              </div>

              {/* Tiempos y Permanencia */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium">Ingreso</div>
                  <div className="text-xs font-bold text-gray-800 mt-1">
                    {new Date(selectedRecord.entryDate).toLocaleString('es-ES')}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium">Salida / Estado</div>
                  <div className="text-xs font-bold text-gray-800 mt-1">
                    {selectedRecord.exitDate ? (
                      new Date(selectedRecord.exitDate).toLocaleString('es-ES')
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        En curso
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tiempo de Permanencia Calculado */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-gray-700">Tiempo de Permanencia:</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">
                  {selectedRecord.permanenceTime?.formatted}
                </span>
              </div>

              {/* Observaciones */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Observaciones
                </h4>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700">
                  {selectedRecord.observations || <span className="italic text-gray-400">Sin observaciones registradas.</span>}
                </div>
              </div>

              {/* Lista de Animales Participantes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Lote de Animales ({selectedRecord.animalIds?.length || 0})
                  </h4>
                </div>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {selectedRecord.animalIds?.map((animalId) => {
                    const animal = animalMap.get(animalId);
                    return (
                      <div key={animalId} className="px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 text-xs">
                        <div className="font-semibold text-gray-900">
                          {animal?.name || 'Animal no encontrado'}
                        </div>
                        <div className="text-gray-500">
                          {animal?.breed || animalId.substring(0, 8)} • <span className="capitalize">{animal?.species || 'N/A'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
