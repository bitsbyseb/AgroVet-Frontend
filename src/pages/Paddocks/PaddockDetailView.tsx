import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { paddockService, animalService, authService } from '../../services/api';
import type { IPaddock, Animal, PaddockStatus, PaddockInput } from '../../types';
import { PaddockForm } from '../../components/Paddocks/PaddockForm';
import {
  ArrowLeft,
  Layers,
  Cat,
  Edit2,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  X,
  ExternalLink,
  MapPin,
  TrendingUp,
  FileText
} from 'lucide-react';

export const PaddockDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paddock, setPaddock] = useState<IPaddock | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUser = authService.getCurrentUser();
  const canManage = currentUser?.role === 'zootechnician' || currentUser?.role === 'administrator';

  useEffect(() => {
    if (id) {
      loadPaddockDetails(id);
    }
  }, [id]);

  const loadPaddockDetails = async (paddockId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [paddockData, allAnimals] = await Promise.all([
        paddockService.getPaddockById(paddockId),
        animalService.list().catch(() => [] as Animal[])
      ]);

      setPaddock(paddockData);
      // Filter animals in this paddock
      const paddockAnimals = (paddockData.animals && paddockData.animals.length > 0)
        ? paddockData.animals
        : allAnimals.filter((a) => a.paddockId === paddockId);

      setAnimals(paddockAnimals);
    } catch (err: unknown) {
      console.error('Error fetching paddock details:', err);
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'No se pudo cargar la información del potrero.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: PaddockInput) => {
    if (!id) return;
    try {
      setSubmitting(true);
      await paddockService.updatePaddock(id, data);
      setIsEditModalOpen(false);
      await loadPaddockDetails(id);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'Error al actualizar el potrero.');
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
            Activo para Pastoreo
          </span>
        );
      case 'RESTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={14} />
            En Periodo de Descanso
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <Wrench size={14} />
            En Mantenimiento
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="card text-center py-20 bg-white">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-gray-500 text-sm">Cargando detalles del potrero...</p>
      </div>
    );
  }

  if (error || !paddock) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/paddocks')}
          className="btn text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Volver a Potreros</span>
        </button>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-semibold">{error || 'Potrero no encontrado.'}</p>
        </div>
      </div>
    );
  }

  const currentCount = animals.length;
  const occupancyPercent = paddock.capacity > 0
    ? Math.min(100, Math.round((currentCount / paddock.capacity) * 100))
    : 0;
  const isOverCapacity = currentCount > paddock.capacity;
  const stockingRate = paddock.area && paddock.area > 0
    ? (currentCount / paddock.area).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Top navigation & action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/paddocks"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            title="Volver al listado"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-gray-900">{paddock.name}</h1>
              {renderStatusBadge(paddock.status)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">ID: {paddock.id}</p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 transition"
          >
            <Edit2 size={16} />
            <span>Editar Potrero</span>
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Capacidad / Ocupación */}
        <div className="card bg-white p-5 border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Carga Animal</span>
            <Layers size={18} className="text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{currentCount}</span>
            <span className="text-sm font-semibold text-gray-500">/ {paddock.capacity} animales</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Ocupación</span>
              <span className={isOverCapacity ? 'text-red-600 font-bold' : 'font-semibold'}>
                {occupancyPercent}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
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
        </div>

        {/* Área & Densidad */}
        <div className="card bg-white p-5 border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Superficie & Densidad</span>
            <MapPin size={18} className="text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {paddock.area !== null && paddock.area !== undefined ? paddock.area : '—'}
            </span>
            <span className="text-sm font-semibold text-gray-500">Hectáreas (ha)</span>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-600" />
            Carga actual: <strong className="text-gray-700">{stockingRate} animales / ha</strong>
          </p>
        </div>

        {/* Fechas / Registro */}
        <div className="card bg-white p-5 border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Información del Sistema</span>
            <Calendar size={18} className="text-emerald-700" />
          </div>
          <div className="space-y-1 mt-1 text-sm text-gray-700">
            <p className="flex justify-between">
              <span className="text-xs text-gray-500">Registrado el:</span>
              <span className="font-medium">
                {paddock.createdAt ? new Date(paddock.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-xs text-gray-500">Última actualización:</span>
              <span className="font-medium">
                {paddock.updatedAt ? new Date(paddock.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      {paddock.description && (
        <div className="card bg-white p-5 border border-gray-100 shadow-sm rounded-xl">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-2">
            <FileText size={16} className="text-emerald-700" />
            Observaciones y Manejo de Pastura
          </h3>
          <p className="text-sm text-gray-700 bg-gray-50 p-3.5 rounded-lg border border-gray-100 leading-relaxed">
            {paddock.description}
          </p>
        </div>
      )}

      {/* Animal List Section */}
      <div className="card bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
              <Cat size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Animales Pastando en este Potrero ({animals.length})
              </h2>
              <p className="text-xs text-gray-500">
                Lista de animales que tienen asignado este potrero actualmente.
              </p>
            </div>
          </div>
          <Link
            to="/animals"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Ver todos los animales
            <ExternalLink size={13} />
          </Link>
        </div>

        {animals.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Cat size={44} className="text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-700">No hay animales asignados a este potrero</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Puedes asignar animales a este potrero desde el módulo de edición de animales o en su registro inicial.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 font-bold">Animal</th>
                  <th className="py-3 px-4 font-bold">Especie</th>
                  <th className="py-3 px-4 font-bold">Raza</th>
                  <th className="py-3 px-4 font-bold">Género</th>
                  <th className="py-3 px-4 font-bold">Color</th>
                  <th className="py-3 px-4 font-bold text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {animals.map((animal) => (
                  <tr key={animal.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {animal.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 font-medium">
                        {animal.species}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{animal.breed}</td>
                    <td className="py-3.5 px-4 capitalize text-gray-700">{animal.gender}</td>
                    <td className="py-3.5 px-4 text-gray-700">{animal.color}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/animals/${animal.id}/history`}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg inline-flex items-center"
                        title="Ver Historial Clínico y Datos"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center"
              title="Cerrar"
            >
              <X size={20} />
            </button>
            <PaddockForm
              initialData={paddock}
              isEditing={true}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
              loading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaddockDetailView;
