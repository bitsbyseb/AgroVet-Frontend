import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { paddockService, animalService, authService } from '../../services/api';
import type { IPaddock, Animal, PaddockStatus, PaddockInput } from '../../types';
import { PaddockForm } from '../../components/Paddocks/PaddockForm';
import {
  Plus,
  Layers,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  Wrench,
  X
} from 'lucide-react';

export const PaddockListView: React.FC = () => {
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
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

  const currentUser = authService.getCurrentUser();
  const canManage = currentUser?.role === 'zootechnician' || currentUser?.role === 'administrator';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paddocksData, animalsData] = await Promise.all([
        paddockService.getPaddocks(),
        animalService.list().catch(() => [] as Animal[])
      ]);
      setPaddocks(paddocksData);
      setAnimals(animalsData);
    } catch (err: unknown) {
      console.error('Error fetching paddocks:', err);
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'No se pudo cargar la lista de potreros.');
    } finally {
      setLoading(false);
    }
  };

  // Map animal count per paddock
  const animalCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    animals.forEach((animal) => {
      if (animal.paddockId) {
        map[animal.paddockId] = (map[animal.paddockId] || 0) + 1;
      }
    });
    return map;
  }, [animals]);

  // Filtered paddocks
  const filteredPaddocks = useMemo(() => {
    return paddocks.filter((paddock) => {
      const matchesSearch = paddock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paddock.description && paddock.description.toLowerCase().includes(searchTerm.toLowerCase()));
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={13} />
            Activo
          </span>
        );
      case 'RESTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={13} />
            En Descanso
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <Wrench size={13} />
            En Mantenimiento
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
                  const occupancyPercent = paddock.capacity > 0
                    ? Math.min(100, Math.round((currentAnimals / paddock.capacity) * 100))
                    : 0;
                  const isOverCapacity = currentAnimals > paddock.capacity;

                  return (
                    <tr key={paddock.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">{paddock.name}</div>
                        {paddock.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                            {paddock.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 font-medium text-gray-700">
                        {paddock.area !== null && paddock.area !== undefined ? `${paddock.area} ha` : 'N/A'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-700">
                            <span>
                              {currentAnimals} / {paddock.capacity} animales
                            </span>
                            <span className={isOverCapacity ? 'text-red-600 font-bold' : 'text-gray-500'}>
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

                      <td className="py-4 px-4">
                        {renderStatusBadge(paddock.status)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            to={`/paddocks/${paddock.id}`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Ver Detalle y Animales"
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

      {/* Create / Edit Modal */}
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
