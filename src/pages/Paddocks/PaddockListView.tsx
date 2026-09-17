import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { paddockService, animalService, grazingService, authService } from '../../services/api';
import type { IPaddock, Animal, PaddockStatus, PaddockInput, IGrazingActivity } from '../../types';
import { PaddockForm } from '../../components/Paddocks/PaddockForm';
import { GrazingForm } from '../../components/Grazing/GrazingForm';
import {
  Plus,
  Layers,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  Wrench,
  X,
  Compass,
  Users,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const PaddockListView: React.FC = () => {
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [grazingActivities, setGrazingActivities] = useState<IGrazingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaddock, setEditingPaddock] = useState<IPaddock | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick View Animals Modal
  const [viewingAnimalsPaddock, setViewingAnimalsPaddock] = useState<IPaddock | null>(null);

  // Quick Grazing Modal
  const [grazingPaddock, setGrazingPaddock] = useState<IPaddock | null>(null);

  const currentUser = authService.getCurrentUser();
  const canManage = currentUser?.role === 'zootechnician' || currentUser?.role === 'administrator';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paddocksData, animalsData, grazingData] = await Promise.all([
        paddockService.getPaddocks(),
        animalService.list().catch(() => [] as Animal[]),
        grazingService.getGrazingActivities().catch(() => [] as IGrazingActivity[])
      ]);
      setPaddocks(paddocksData);
      setAnimals(animalsData);
      setGrazingActivities(grazingData);
    } catch (err: unknown) {
      console.error('Error fetching paddocks:', err);
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'No se pudo cargar la lista de potreros.');
    } finally {
      setLoading(false);
    }
  };

  // Active grazing activities
  const activeGrazingActivities = useMemo(() => {
    return grazingActivities.filter(
      (act) => !act.exitDate || new Date(act.exitDate) > new Date()
    );
  }, [grazingActivities]);

  // Animals grouped by paddock (direct + active grazing, without duplicates)
  const paddockAnimalsMap = useMemo(() => {
    const map: Record<string, Animal[]> = {};
    paddocks.forEach((paddock) => {
      const direct = animals.filter((a) => a.paddockId === paddock.id);
      const activeForPaddock = activeGrazingActivities.filter(
        (g) => g.paddockId === paddock.id
      );
      const grazingAnimalIds = new Set<string>();
      activeForPaddock.forEach((g) =>
        g.animalIds?.forEach((id) => grazingAnimalIds.add(id))
      );
      const grazing = animals.filter((a) => grazingAnimalIds.has(a.id));

      const combinedMap = new Map<string, Animal>();
      direct.forEach((a) => combinedMap.set(a.id, a));
      grazing.forEach((a) => combinedMap.set(a.id, a));

      map[paddock.id] = Array.from(combinedMap.values());
    });
    return map;
  }, [paddocks, animals, activeGrazingActivities]);

  // Animal count per paddock
  const animalCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(paddockAnimalsMap).forEach(([paddockId, list]) => {
      counts[paddockId] = list.length;
    });
    return counts;
  }, [paddockAnimalsMap]);

  // Filtered paddocks
  const filteredPaddocks = useMemo(() => {
    return paddocks.filter((paddock) => {
      const matchesSearch =
        paddock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paddock.description &&
          paddock.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || paddock.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [paddocks, searchTerm, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingPaddock(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (paddock: IPaddock) => {
    setEditingPaddock(paddock);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPaddock(null);
  };

  const handleFormSubmit = async (data: PaddockInput) => {
    try {
      setSubmitting(true);
      setError(null);
      if (editingPaddock) {
        await paddockService.updatePaddock(editingPaddock.id, data);
        setSuccessMsg(`Potrero "${data.name}" actualizado con éxito.`);
      } else {
        await paddockService.createPaddock(data);
        setSuccessMsg(`Potrero "${data.name}" registrado con éxito.`);
      }
      handleCloseModal();
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'Error al guardar el potrero.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: PaddockStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={14} />
            Activo
          </span>
        );
      case 'RESTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={14} />
            En Descanso
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <Wrench size={14} />
            Mantenimiento
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="text-emerald-700" size={28} />
            Gestión de Potreros
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Supervisión de áreas de pastoreo, rotación de praderas y capacidad de carga animal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg"
            title="Refrescar potreros"
          >
            <RefreshCw size={16} />
          </button>

          {canManage && (
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 shadow-sm transition"
            >
              <Plus size={18} />
              <span>Nuevo Potrero</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-r-md shadow-sm">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-sm">
          {error}
        </div>
      )}

      {/* Filters bar */}
      <div className="card bg-white shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              className="form-control w-full text-sm rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-gray-600 uppercase shrink-0">Estado:</span>
            <select
              className="form-control text-sm rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="RESTING">En Descanso</option>
              <option value="MAINTENANCE">En Mantenimiento</option>
            </select>
          </div>
        </div>
      </div>

      {/* Paddocks Table */}
      <div className="card bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3" />
            <p className="text-gray-500 text-sm">Cargando potreros y ocupación...</p>
          </div>
        ) : filteredPaddocks.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Layers size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No se encontraron potreros</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Intenta ajustar tus filtros de búsqueda.'
                : 'Comienza registrando tu primer potrero para la rotación de animales.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                  <th className="py-3.5 px-4 font-bold">Potrero</th>
                  <th className="py-3.5 px-4 font-bold">Área (ha)</th>
                  <th className="py-3.5 px-4 font-bold">Ocupación / Capacidad</th>
                  <th className="py-3.5 px-4 font-bold">Estado</th>
                  <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPaddocks.map((paddock) => {
                  const currentAnimals = animalCountMap[paddock.id] || 0;
                  const occupancyPercent =
                    paddock.capacity > 0
                      ? Math.min(100, Math.round((currentAnimals / paddock.capacity) * 100))
                      : 0;
                  const isOverCapacity = currentAnimals > paddock.capacity;

                  return (
                    <tr key={paddock.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-4 px-4">
                        <Link
                          to={`/paddocks/${paddock.id}`}
                          className="font-bold text-gray-900 hover:text-emerald-700 transition"
                        >
                          {paddock.name}
                        </Link>
                        {paddock.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                            {paddock.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 font-medium text-gray-700">
                        {paddock.area !== null && paddock.area !== undefined
                          ? `${paddock.area} ha`
                          : 'N/A'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-700">
                            <button
                              type="button"
                              onClick={() => setViewingAnimalsPaddock(paddock)}
                              className="text-emerald-800 hover:underline flex items-center gap-1 font-semibold"
                              title="Ver lista de animales en este potrero"
                            >
                              <Users size={13} className="text-emerald-700" />
                              <span>
                                {currentAnimals} / {paddock.capacity} animales
                              </span>
                            </button>
                            <span
                              className={isOverCapacity ? 'text-red-600 font-bold' : 'text-gray-500'}
                            >
                              {occupancyPercent}%
                            </span>
                          </div>
                          <div className="w-40 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isOverCapacity
                                  ? 'bg-red-500'
                                  : occupancyPercent > 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">{renderStatusBadge(paddock.status)}</td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setViewingAnimalsPaddock(paddock)}
                            className="p-1.5 text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Ver animales asignados"
                          >
                            <Users size={18} />
                          </button>

                          {canManage && paddock.status !== 'MAINTENANCE' && (
                            <button
                              type="button"
                              onClick={() => setGrazingPaddock(paddock)}
                              className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition"
                              title="Iniciar Pastoreo en este potrero"
                            >
                              <Compass size={18} />
                            </button>
                          )}

                          <Link
                            to={`/paddocks/${paddock.id}`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Ver Detalle Completo"
                          >
                            <Eye size={18} />
                          </Link>

                          {canManage && (
                            <button
                              onClick={() => handleOpenEditModal(paddock)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              title="Editar Potrero"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
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

      {/* Modal: Vista Rápida de Animales en el Potrero */}
      {viewingAnimalsPaddock && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Animales en {viewingAnimalsPaddock.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Capacidad: {viewingAnimalsPaddock.capacity} | Ocupados:{' '}
                    {paddockAnimalsMap[viewingAnimalsPaddock.id]?.length || 0}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAnimalsPaddock(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-2">
              {(paddockAnimalsMap[viewingAnimalsPaddock.id] || []).length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No hay animales asignados ni en pastoreo activo en este potrero actualmente.
                </div>
              ) : (
                (paddockAnimalsMap[viewingAnimalsPaddock.id] || []).map((animal) => (
                  <div
                    key={animal.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-900">{animal.name}</div>
                      <div className="text-[11px] text-gray-500 capitalize">
                        {animal.species} • {animal.breed} • {animal.gender}
                      </div>
                    </div>
                    <Link
                      to={`/animals/${animal.id}/history`}
                      className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <span>Ver Ficha</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
              <Link
                to={`/paddocks/${viewingAnimalsPaddock.id}`}
                className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Ir al Detalle Completo del Potrero</span>
                <ExternalLink size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setViewingAnimalsPaddock(null)}
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 px-4 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Iniciar Pastoreo Rápido */}
      {grazingPaddock && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Iniciar Pastoreo en {grazingPaddock.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Asigna un lote de animales a este potrero para rotación.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGrazingPaddock(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <GrazingForm
              initialPaddockId={grazingPaddock.id}
              onSubmitSuccess={() => {
                setGrazingPaddock(null);
                setSuccessMsg('Actividad de pastoreo registrada exitosamente.');
                loadData();
                setTimeout(() => setSuccessMsg(null), 4000);
              }}
              onCancel={() => setGrazingPaddock(null)}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Paddock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center"
              title="Cerrar"
            >
              <X size={20} />
            </button>
            <PaddockForm
              initialData={editingPaddock || undefined}
              isEditing={!!editingPaddock}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              loading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaddockListView;
