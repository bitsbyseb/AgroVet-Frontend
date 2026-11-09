import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { animalService, paddockService, grazingService, ownerService, authService } from '../../services/api';
import type { Animal, IPaddock, IGrazingActivity, Owner, AnimalSearchParams } from '../../types';
import { formatDateShort } from '../../utils/l10n';
import { AnimalSearch } from '../../components/AnimalSearch';
import { AnimalFilters, type FilterValues } from '../../components/AnimalFilters';
import {
  Plus,
  Cat,
  Edit2,
  RefreshCw,
  Trash2,
  Stethoscope,
  Syringe,
  Package,
  Activity,
  Utensils,
  AlertCircle,
  Layers,
  X,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

export const AnimalsList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [grazingActivities, setGrazingActivities] = useState<IGrazingActivity[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters state (HU14 & HU15)
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterValues>({});
  const [showFilters, setShowFilters] = useState(false);

  const [user, setUser] = useState(authService.getCurrentUser());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    fetchData();
  }, []);

  // Manejo de accesibilidad en diálogo de confirmación (Escape y scroll lock)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteTarget && !deleting) {
        setDeleteTarget(null);
      }
    };

    if (deleteTarget) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteTarget, deleting]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [animalsData, paddocksData, grazingData, ownersData] = await Promise.all([
        animalService.list().catch(() => [] as Animal[]),
        paddockService.getPaddocks().catch(() => [] as IPaddock[]),
        grazingService.getGrazingActivities().catch(() => [] as IGrazingActivity[]),
        ownerService.list().catch(() => [] as Owner[])
      ]);
      setAnimals(animalsData);
      setPaddocks(paddocksData);
      setGrazingActivities(grazingData);
      setOwners(ownersData.map(o => ({ id: o.id, name: o.name })));
      setSearchTerm('');
      setFilters({});
    } catch (err) {
      console.error('Error fetching animals:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Unified function combining text search and filters
  const fetchWithParams = async (search: string, currentFilters: FilterValues) => {
    try {
      setSearching(true);
      setError(null);
      const params: AnimalSearchParams = {
        query: search.trim() || undefined,
        species: currentFilters.species,
        ownerId: currentFilters.ownerId,
        status: currentFilters.status,
      };

      const hasParams = Boolean(params.query || params.species || params.ownerId || params.status);
      const results = hasParams
        ? await animalService.search(params)
        : await animalService.list();

      setAnimals(results);
    } catch (err) {
      console.error('Error fetching animals with parameters:', err);
      setError(t('common.error'));
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchWithParams(term, filters);
  };

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    fetchWithParams(searchTerm, newFilters);
  };

  const handleResetFilters = () => {
    const emptyFilters: FilterValues = {};
    setFilters(emptyFilters);
    fetchWithParams(searchTerm, emptyFilters);
  };

  const handleResetAll = () => {
    setSearchTerm('');
    const emptyFilters: FilterValues = {};
    setFilters(emptyFilters);
    fetchWithParams('', emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await animalService.delete(deleteTarget.id);
      setAnimals((prev) => prev.filter((animal) => animal.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || t('common.error'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  // Map each animal to its assigned paddock (direct or active grazing)
  const animalPaddockMap = useMemo(() => {
    const map = new Map<string, { paddock: IPaddock; isGrazing: boolean; rotationNumber?: number }>();
    const paddockLookup = new Map(paddocks.map(p => [p.id, p]));
    const activeGrazing = grazingActivities.filter(g => !g.exitDate || new Date(g.exitDate) > new Date());

    animals.forEach(animal => {
      // Check active grazing first
      const activeRot = activeGrazing.find(g => g.animalIds?.includes(animal.id));
      if (activeRot && paddockLookup.has(activeRot.paddockId)) {
        map.set(animal.id, {
          paddock: paddockLookup.get(activeRot.paddockId)!,
          isGrazing: true,
          rotationNumber: activeRot.rotationNumber
        });
      } else if (animal.paddockId && paddockLookup.has(animal.paddockId)) {
        map.set(animal.id, {
          paddock: paddockLookup.get(animal.paddockId)!,
          isGrazing: false
        });
      }
    });
    return map;
  }, [animals, paddocks, grazingActivities]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Cat className="text-emerald-700" size={28} />
            <span>{t('animals.title')}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('animals.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg transition cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw size={16} />
          </button>
          <Link 
            to="/animals/new" 
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>{t('common.newRecord')}</span>
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de búsqueda y Filtros avanzados (HU14 & HU15) */}
      <div className="card bg-white shadow-xs border border-gray-100 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <AnimalSearch
              onSearch={handleSearch}
              initialValue={searchTerm}
              isLoading={searching}
              placeholder={t('animals.searchPlaceholder')}
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Toggle Filtros */}
            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className={`btn text-xs px-3.5 py-2 rounded-xl border transition inline-flex items-center gap-1.5 cursor-pointer ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title={t('animals.filters.filterButton')}
            >
              <SlidersHorizontal size={14} className={activeFiltersCount > 0 ? 'text-emerald-700' : 'text-gray-500'} />
              <span>{t('animals.filters.filterButton')}</span>
              {activeFiltersCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Limpiar búsqueda y filtros combinados */}
            {(searchTerm || activeFiltersCount > 0) && (
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-gray-500 hover:text-emerald-700 font-medium underline inline-flex items-center gap-1 transition cursor-pointer px-1 py-1"
              >
                <X size={13} />
                <span>{t('animals.filters.clearFilters')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Panel Desplegable de Filtros */}
        {showFilters && (
          <AnimalFilters
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            owners={owners}
          />
        )}
      </div>

      <div className="card bg-white shadow-xs border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3" />
            <p className="text-gray-500 text-sm">{t('animals.loading')}</p>
          </div>
        ) : animals.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Cat size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">{t('animals.emptyTitle')}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm || activeFiltersCount > 0
                ? t('animals.filters.noMatchingFilter')
                : t('animals.emptyInitial')}
            </p>
            {(searchTerm || activeFiltersCount > 0) && (
              <button
                type="button"
                onClick={handleResetAll}
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs mt-4 px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>{t('animals.filters.clearFilters')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                  <th className="py-3.5 px-4 font-bold">{t('animals.table.animal')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('animals.table.species')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('animals.table.breed')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('animals.table.currentPaddock')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('animals.table.birthDate')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('animals.table.status')}</th>
                  <th className="py-3.5 px-4 font-bold text-right">{t('animals.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {animals.map((animal) => {
                  const paddockInfo = animalPaddockMap.get(animal.id);

                  return (
                    <tr key={animal.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                            <Cat size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{animal.name}</span>
                            <span className="text-[11px] text-gray-400 font-mono tracking-tight" title={animal.id}>
                              ID: {animal.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-gray-700">
                        {t(`animals.species.${animal.species}`, { defaultValue: animal.species })}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">{animal.breed}</td>
                      <td className="py-3.5 px-4">
                        {paddockInfo ? (
                          <Link
                            to={`/paddocks/${paddockInfo.paddock.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200"
                            title={
                              paddockInfo.isGrazing
                                ? `${t('animals.grazing')}: ${t('animals.rotation', { num: paddockInfo.rotationNumber })}`
                                : paddockInfo.paddock.name
                            }
                          >
                            <Layers size={12} className="text-emerald-700" />
                            <span>{paddockInfo.paddock.name}</span>
                            {paddockInfo.isGrazing && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-normal">
                                R#{paddockInfo.rotationNumber}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs italic">{t('animals.noPaddock')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {animal.birthDate ? formatDateShort(animal.birthDate, lang) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          animal.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {animal.status === 'inactive' ? t('common.inactive') : t('common.active')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Link 
                            to={`/animals/${animal.id}/history`} 
                            className="p-2 min-h-[36px] min-w-[36px] text-emerald-700 hover:bg-emerald-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                            title={t('animals.tooltips.history')}
                            aria-label={t('animals.tooltips.history')}
                          >
                            <Stethoscope size={16} />
                          </Link>
                          <Link 
                            to={`/animals/${animal.id}/vaccines`} 
                            className="p-2 min-h-[36px] min-w-[36px] text-cyan-700 hover:bg-cyan-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                            title={t('animals.tooltips.vaccines')}
                            aria-label={t('animals.tooltips.vaccines')}
                          >
                            <Syringe size={16} />
                          </Link>
                          {user?.role !== 'veterinarian' && (
                            <Link 
                              to={`/animals/${animal.id}/diet`} 
                              className="p-2 min-h-[36px] min-w-[36px] text-orange-600 hover:bg-orange-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                              title={t('animals.tooltips.diet')}
                              aria-label={t('animals.tooltips.diet')}
                            >
                              <Utensils size={16} />
                            </Link>
                          )}
                          {animal.animalType === 'rural' && (
                            <>
                              <Link 
                                to={`/animals/${animal.id}/production`} 
                                className="p-2 min-h-[36px] min-w-[36px] text-emerald-800 hover:bg-emerald-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                                title={t('animals.tooltips.production')}
                                aria-label={t('animals.tooltips.production')}
                              >
                                <Package size={16} />
                              </Link>
                              {user?.role !== 'veterinarian' && (
                                <Link 
                                  to={`/animals/${animal.id}/reproduction`} 
                                  className="p-2 min-h-[36px] min-w-[36px] text-pink-600 hover:bg-pink-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                                  title={t('animals.tooltips.reproduction')}
                                  aria-label={t('animals.tooltips.reproduction')}
                                >
                                  <Activity size={16} />
                                </Link>
                              )}
                            </>
                          )}
                          <Link 
                            to={`/animals/${animal.id}/edit`} 
                            className="p-2 min-h-[36px] min-w-[36px] text-gray-600 hover:bg-gray-100 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                            title={t('animals.tooltips.edit')}
                            aria-label={t('animals.tooltips.edit')}
                          >
                            <Edit2 size={16} />
                          </Link>
                          <Link 
                            to={`/animals/${animal.id}/transfer`} 
                            className="p-2 min-h-[36px] min-w-[36px] text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                            title={t('animals.tooltips.transfer')}
                            aria-label={t('animals.tooltips.transfer')}
                          >
                            <RefreshCw size={16} />
                          </Link>
                          <button 
                            type="button"
                            onClick={() => setDeleteTarget({ id: animal.id, name: animal.name })} 
                            className="p-2 min-h-[36px] min-w-[36px] text-red-600 hover:bg-red-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                            title={t('animals.tooltips.delete')}
                            aria-label={t('animals.tooltips.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación accesible de eliminación */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-animal-title"
          aria-describedby="delete-animal-desc"
        >
          <div className="card bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-full shrink-0">
                <Trash2 size={22} />
              </div>
              <h3 id="delete-animal-title" className="text-base font-bold text-gray-900">
                {t('common.delete')}
              </h3>
            </div>

            <p id="delete-animal-desc" className="text-sm text-gray-600 leading-relaxed">
              {t('common.confirmDelete', { name: deleteTarget.name })}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3.5 transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-4 shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                aria-busy={deleting}
              >
                <Trash2 size={14} />
                <span>{deleting ? t('common.saving') : t('common.delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalsList;
