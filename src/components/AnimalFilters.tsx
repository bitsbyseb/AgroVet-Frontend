import React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, RotateCcw, User, PawPrint, CheckCircle2 } from 'lucide-react';
import { SpeciesType } from '../types';

export interface FilterValues {
  species?: string;
  ownerId?: string;
  status?: string;
}

export interface AnimalFiltersProps {
  filters: FilterValues;
  onChange: (newFilters: FilterValues) => void;
  onReset: () => void;
  owners: { id: string; name: string }[];
  className?: string;
}

export const AnimalFilters: React.FC<AnimalFiltersProps> = ({
  filters,
  onChange,
  onReset,
  owners,
  className = '',
}) => {
  const { t } = useTranslation();

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, species: e.target.value || undefined });
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, ownerId: e.target.value || undefined });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value || undefined });
  };

  return (
    <div className={`bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 space-y-3 ${className}`}>
      {/* Header with active filter counter and reset button */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-emerald-700" />
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            {t('animals.filters.title')}
          </span>
          {activeFiltersCount > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {activeFiltersCount}
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-emerald-700 font-medium inline-flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>{t('animals.filters.clearFilters')}</span>
          </button>
        )}
      </div>

      {/* Grid of filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Especie */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <PawPrint size={13} className="text-gray-500" />
            <span>{t('animals.filters.species')}</span>
          </label>
          <select
            value={filters.species || ''}
            onChange={handleSpeciesChange}
            aria-label={t('animals.filters.species')}
            className="form-control w-full text-xs py-2 px-3 bg-white border border-gray-200 rounded-lg shadow-2xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
          >
            <option value="">{t('animals.filters.allSpecies')}</option>
            {Object.values(SpeciesType).map((spec) => (
              <option key={spec} value={spec}>
                {t(`animals.species.${spec}`, { defaultValue: spec })}
              </option>
            ))}
          </select>
        </div>

        {/* Propietario */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <User size={13} className="text-gray-500" />
            <span>{t('animals.filters.owner')}</span>
          </label>
          <select
            value={filters.ownerId || ''}
            onChange={handleOwnerChange}
            aria-label={t('animals.filters.owner')}
            className="form-control w-full text-xs py-2 px-3 bg-white border border-gray-200 rounded-lg shadow-2xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
          >
            <option value="">{t('animals.filters.allOwners')}</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-gray-500" />
            <span>{t('animals.filters.status')}</span>
          </label>
          <select
            value={filters.status || ''}
            onChange={handleStatusChange}
            aria-label={t('animals.filters.status')}
            className="form-control w-full text-xs py-2 px-3 bg-white border border-gray-200 rounded-lg shadow-2xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
          >
            <option value="">{t('animals.filters.allStatuses')}</option>
            <option value="active">{t('animals.filters.active')}</option>
            <option value="inactive">{t('animals.filters.inactive')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AnimalFilters;
