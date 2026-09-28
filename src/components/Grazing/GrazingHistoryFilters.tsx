import React from 'react';
import type { IPaddock, Animal, GrazingHistoryFilters as GrazingHistoryFiltersData } from '../../types';
import { Layers, Calendar, RotateCcw, Filter, Search } from 'lucide-react';

export interface GrazingHistoryFiltersProps {
  filters: GrazingHistoryFiltersData;
  onFilterChange: (newFilters: GrazingHistoryFiltersData) => void;
  onReset: () => void;
  paddocks: IPaddock[];
  animals: Animal[];
  isLoading?: boolean;
}

export const GrazingHistoryFilters: React.FC<GrazingHistoryFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  paddocks,
  animals,
  isLoading = false
}) => {
  const handleChange = (field: keyof GrazingHistoryFiltersData, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters = Boolean(
    (filters.paddockId && filters.paddockId !== 'ALL') ||
    (filters.animalId && filters.animalId !== 'ALL') ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 mb-6 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-gray-800 text-base">Filtros de Búsqueda</h3>
          {hasActiveFilters && (
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Filtros activos
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Restablecer todos los filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selector de Potrero */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Potrero
          </label>
          <select
            aria-label="Potrero"
            value={filters.paddockId || 'ALL'}
            onChange={(e) => handleChange('paddockId', e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:opacity-50"
          >
            <option value="ALL">Todos los potreros</option>
            {paddocks.map((paddock) => (
              <option key={paddock.id} value={paddock.id}>
                {paddock.name} (Cap: {paddock.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Animal */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            Animal Participante
          </label>
          <select
            aria-label="Animal Participante"
            value={filters.animalId || 'ALL'}
            onChange={(e) => handleChange('animalId', e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:opacity-50"
          >
            <option value="ALL">Todos los animales</option>
            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.name} - {animal.breed || animal.species}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha Inicio */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Fecha Desde
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:opacity-50"
          />
        </div>

        {/* Fecha Fin */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Fecha Hasta
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            min={filters.startDate || undefined}
            onChange={(e) => handleChange('endDate', e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};
