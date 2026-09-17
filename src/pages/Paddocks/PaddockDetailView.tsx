import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { paddockService, animalService, grazingService, authService } from '../../services/api';
import type { IPaddock, Animal, PaddockStatus, PaddockInput, IGrazingActivity } from '../../types';
import { PaddockForm } from '../../components/Paddocks/PaddockForm';
import { GrazingForm } from '../../components/Grazing/GrazingForm';
import {
  ArrowLeft,
  Layers,
  Cat,
  Edit2,
  CheckCircle2,
  Clock,
  Wrench,
  X,
  ExternalLink,
  MapPin,
  TrendingUp,
  FileText,
  Compass,
  Plus,
  Users,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  RefreshCw,
  Eye,
  UserMinus
} from 'lucide-react';

interface PaddockAnimalRecord extends Animal {
  isDirect: boolean;
  isGrazing: boolean;
  activeRotations: IGrazingActivity[];
}

export const PaddockDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paddock, setPaddock] = useState<IPaddock | null>(null);
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [grazingActivities, setGrazingActivities] = useState<IGrazingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'animals' | 'grazing'>('animals');

  // Search filter for animals inside paddock
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGrazingModalOpen, setIsGrazingModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<IGrazingActivity | null>(null);

  // Direct assign modal state
  const [selectedAnimalsToAssign, setSelectedAnimalsToAssign] = useState<string[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [assignSpeciesFilter, setAssignSpeciesFilter] = useState('ALL');
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
      const [paddockData, animalsData, grazingData] = await Promise.all([
        paddockService.getPaddockById(paddockId),
        animalService.list().catch(() => [] as Animal[]),
        grazingService.getGrazingActivities(paddockId).catch(() => [] as IGrazingActivity[])
      ]);

      setPaddock(paddockData);
      setAllAnimals(animalsData);
      setGrazingActivities(grazingData);
    } catch (err: unknown) {
      console.error('Error fetching paddock details:', err);
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'No se pudo cargar la información del potrero.');
    } finally {
      setLoading(false);
    }
  };

  // Actividades de pastoreo activas
  const activeGrazingActivities = useMemo(() => {
    return grazingActivities.filter((act) => !act.exitDate || new Date(act.exitDate) > new Date());
  }, [grazingActivities]);

  // Animales asignados a este potrero (directos + activos en pastoreo)
  const currentPaddockAnimals = useMemo<PaddockAnimalRecord[]>(() => {
    if (!paddock) return [];

    return allAnimals
      .map((animal) => {
        const isDirect = animal.paddockId === paddock.id;
        const activeRotations = activeGrazingActivities.filter((act) =>
          act.animalIds?.includes(animal.id)
        );
        const isGrazing = activeRotations.length > 0;

        return {
          ...animal,
          isDirect,
          isGrazing,
          activeRotations
        };
      })
      .filter((animal) => animal.isDirect || animal.isGrazing);
  }, [allAnimals, paddock, activeGrazingActivities]);

  // Animales filtrados por búsqueda
  const filteredPaddockAnimals = useMemo(() => {
    return currentPaddockAnimals.filter((animal) => {
      const term = animalSearchTerm.toLowerCase();
      return (
        animal.name.toLowerCase().includes(term) ||
        animal.breed.toLowerCase().includes(term) ||
        animal.species.toLowerCase().includes(term)
      );
    });
  }, [currentPaddockAnimals, animalSearchTerm]);

  // Animales candidatos para asignar directamente (no están en este potrero actualmente)
  const availableAnimalsToAssign = useMemo(() => {
    if (!paddock) return [];
    return allAnimals.filter((animal) => {
      const isAlreadyInPaddock = animal.paddockId === paddock.id;
      const matchesSearch =
        animal.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
        animal.breed.toLowerCase().includes(assignSearchTerm.toLowerCase());
      const matchesSpecies =
        assignSpeciesFilter === 'ALL' || animal.species === assignSpeciesFilter;

      return !isAlreadyInPaddock && matchesSearch && matchesSpecies;
    });
  }, [allAnimals, paddock, assignSearchTerm, assignSpeciesFilter]);

  const handleUpdate = async (data: PaddockInput) => {
    if (!id) return;
    try {
      setSubmitting(true);
      await paddockService.updatePaddock(id, data);
      setIsEditModalOpen(false);
      setSuccessMsg('Potrero actualizado exitosamente.');
      await loadPaddockDetails(id);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'Error al actualizar el potrero.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || selectedAnimalsToAssign.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      // Asignar los animales seleccionados a este potrero
      await Promise.all(
        selectedAnimalsToAssign.map((animalId) =>
          animalService.update(animalId, { paddockId: id })
        )
      );

      setIsAssignModalOpen(false);
      setSelectedAnimalsToAssign([]);
      setSuccessMsg(
        `Se asignaron exitosamente ${selectedAnimalsToAssign.length} animal(es) a este potrero.`
      );
      await loadPaddockDetails(id);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error('Error asignando animales al potrero:', err);
      setError('Ocurrió un error al asignar animales a este potrero.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignAnimal = async (animal: PaddockAnimalRecord) => {
    if (!window.confirm(`¿Deseas desasignar a ${animal.name} de este potrero?`)) return;

    try {
      setSubmitting(true);
      await animalService.update(animal.id, { paddockId: null });
      setSuccessMsg(`Animal ${animal.name} desasignado del potrero.`);
      await loadPaddockDetails(id!);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error('Error desasignando animal:', err);
      setError('Error al desasignar el animal del potrero.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrazingCreated = () => {
    setIsGrazingModalOpen(false);
    setSuccessMsg('Actividad de pastoreo registrada exitosamente en este potrero.');
    if (id) loadPaddockDetails(id);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const toggleSelectAnimalToAssign = (animalId: string) => {
    setSelectedAnimalsToAssign((prev) =>
      prev.includes(animalId) ? prev.filter((i) => i !== animalId) : [...prev, animalId]
    );
  };

  const handleSelectAllAssignFiltered = () => {
    const ids = availableAnimalsToAssign.map((a) => a.id);
    const allSelected = ids.every((i) => selectedAnimalsToAssign.includes(i));
    if (allSelected) {
      setSelectedAnimalsToAssign((prev) => prev.filter((i) => !ids.includes(i)));
    } else {
      setSelectedAnimalsToAssign((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'En curso';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch {
      return dateString;
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
        <p className="text-gray-500 text-sm">Cargando detalles del potrero y animales asignados...</p>
      </div>
    );
  }

  if (error && !paddock) {
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

  if (!paddock) return null;

  const currentCount = currentPaddockAnimals.length;
  const occupancyPercent =
    paddock.capacity > 0 ? Math.min(100, Math.round((currentCount / paddock.capacity) * 100)) : 0;
  const isOverCapacity = currentCount > paddock.capacity;
  const stockingRate =
    paddock.area && paddock.area > 0 ? (currentCount / paddock.area).toFixed(1) : 'N/A';

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-r-md shadow-sm flex items-center gap-2 text-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-sm flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">{paddock.name}</h1>
              {renderStatusBadge(paddock.status)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">ID: {paddock.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadPaddockDetails(paddock.id)}
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg"
            title="Recargar datos"
          >
            <RefreshCw size={16} />
          </button>

          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="btn bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 py-2 px-3 text-sm font-semibold rounded-lg"
              >
                <Plus size={16} />
                <span>Asignar Animales</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGrazingModalOpen(true)}
                disabled={paddock.status === 'MAINTENANCE'}
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 py-2 px-3 text-sm font-semibold rounded-lg disabled:opacity-50"
                title={paddock.status === 'MAINTENANCE' ? 'No disponible en mantenimiento' : 'Registrar nueva rotación'}
              >
                <Compass size={16} />
                <span>Iniciar Pastoreo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-1.5 py-2 px-3 text-sm font-semibold rounded-lg"
              >
                <Edit2 size={16} />
                <span>Editar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Capacidad / Ocupación */}
        <div className="card bg-white p-5 border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Carga Animal Actual</span>
            <Layers size={18} className="text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{currentCount}</span>
            <span className="text-sm font-semibold text-gray-500">/ {paddock.capacity} aforo</span>
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

        {/* Estado de Rotaciones */}
        <div className="card bg-white p-5 border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rotaciones de Pastoreo</span>
            <Compass size={18} className="text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {activeGrazingActivities.length}
            </span>
            <span className="text-sm font-semibold text-gray-500">activas en curso</span>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
            <Clock size={14} className="text-emerald-600" />
            Historial acumulado:{' '}
            <strong className="text-gray-700">{grazingActivities.length} rotaciones</strong>
          </p>
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

      {/* Tabs Switcher: Animales vs Rotaciones de Pastoreo */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('animals')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'animals'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Cat size={18} />
            <span>Animales en este Potrero ({currentCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grazing')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'grazing'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Compass size={18} />
            <span>Historial de Pastoreo ({grazingActivities.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Animales asignados al potrero */}
      {activeTab === 'animals' && (
        <div className="card bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden p-0">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Listado de Animales Pastando ({currentCount})
              </h2>
              <p className="text-xs text-gray-500">
                Animales asignados permanentemente o presentes a través de una rotación activa de pastoreo.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar animal o raza..."
                  value={animalSearchTerm}
                  onChange={(e) => setAnimalSearchTerm(e.target.value)}
                  className="form-control text-xs pl-9 py-2 rounded-lg"
                />
              </div>

              {canManage && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus size={14} />
                  <span>Agregar Animal</span>
                </button>
              )}
            </div>
          </div>

          {currentPaddockAnimals.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Cat size={48} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">
                No hay animales asignados a este potrero
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Puedes asignar animales directamente a este potrero o registrar una nueva rotación de pastoreo.
              </p>
              {canManage && (
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="btn bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs py-2 px-4 rounded-lg font-semibold"
                  >
                    <Plus size={16} />
                    Asignar Animales
                  </button>
                  <button
                    onClick={() => setIsGrazingModalOpen(true)}
                    disabled={paddock.status === 'MAINTENANCE'}
                    className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 rounded-lg font-semibold disabled:opacity-50"
                  >
                    <Compass size={16} />
                    Iniciar Pastoreo
                  </button>
                </div>
              )}
            </div>
          ) : filteredPaddockAnimals.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500 text-sm">
                No se encontraron animales que coincidan con la búsqueda "{animalSearchTerm}".
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
                    <th className="py-3 px-4 font-bold">Origen / Modalidad</th>
                    <th className="py-3 px-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredPaddockAnimals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{animal.name}</div>
                        <div className="text-xs text-gray-400">ID: {animal.id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 font-medium">
                          {animal.species}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">{animal.breed}</td>
                      <td className="py-3.5 px-4 capitalize text-gray-700">{animal.gender}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {animal.isGrazing &&
                            animal.activeRotations.map((rot) => (
                              <span
                                key={rot.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                <Compass size={12} />
                                Pastoreo Activo: Rotación #{rot.rotationNumber}
                              </span>
                            ))}
                          {animal.isDirect && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <Layers size={12} />
                              Asignación Fija al Potrero
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            to={`/animals/${animal.id}/history`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg inline-flex items-center transition"
                            title="Ver Historial Clínico"
                          >
                            <ExternalLink size={16} />
                          </Link>

                          {canManage && animal.isDirect && (
                            <button
                              type="button"
                              onClick={() => handleUnassignAnimal(animal)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center transition"
                              title="Desasignar de este potrero"
                            >
                              <UserMinus size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Historial de Pastoreo en este potrero */}
      {activeTab === 'grazing' && (
        <div className="card bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden p-0">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Rotaciones de Pastoreo en este Potrero ({grazingActivities.length})
              </h2>
              <p className="text-xs text-gray-500">
                Historial completo de lotes de animales que han ingresado a este potrero.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => setIsGrazingModalOpen(true)}
                disabled={paddock.status === 'MAINTENANCE'}
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                <Compass size={14} />
                <span>Nueva Rotación</span>
              </button>
            )}
          </div>

          {grazingActivities.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Compass size={48} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">
                Sin rotaciones de pastoreo registradas
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Aún no se ha registrado ninguna actividad de pastoreo para este potrero.
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsGrazingModalOpen(true)}
                  disabled={paddock.status === 'MAINTENANCE'}
                  className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 rounded-lg mt-4 font-semibold disabled:opacity-50"
                >
                  <Plus size={16} />
                  Registrar Primera Rotación
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4 font-bold">Rotación</th>
                    <th className="py-3 px-4 font-bold">Animales en Lote</th>
                    <th className="py-3 px-4 font-bold">Fecha Ingreso</th>
                    <th className="py-3 px-4 font-bold">Fecha Salida</th>
                    <th className="py-3 px-4 font-bold">Estado</th>
                    <th className="py-3 px-4 font-bold text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {grazingActivities.map((act) => {
                    const isActive = !act.exitDate || new Date(act.exitDate) > new Date();

                    return (
                      <tr key={act.id} className="hover:bg-gray-50/75 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800">
                            Rotación #{act.rotationNumber}
                          </span>
                          {act.observations && (
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {act.observations}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <Users size={16} className="text-gray-400" />
                            <span>{act.animalIds?.length || 0} animales</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">{formatDate(act.entryDate)}</td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {isActive ? (
                            <span className="text-emerald-700 font-medium italic">En curso</span>
                          ) : (
                            formatDate(act.exitDate)
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Finalizado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedActivityForDetail(act)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg inline-flex items-center transition"
                            title="Ver animales de esta rotación"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Editar Potrero */}
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

      {/* Modal: Asignar Animales Directamente a este Potrero */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Asignar Animales a {paddock.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Selecciona animales para asignarlos de forma directa y permanente a este potrero.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDirectAssignSubmit} className="flex flex-col flex-1 overflow-hidden mt-4 gap-3">
              {/* Buscador y filtro */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o raza..."
                    value={assignSearchTerm}
                    onChange={(e) => setAssignSearchTerm(e.target.value)}
                    className="form-control pl-9 text-xs py-2 rounded-lg"
                  />
                </div>
                <select
                  value={assignSpeciesFilter}
                  onChange={(e) => setAssignSpeciesFilter(e.target.value)}
                  className="form-control text-xs py-2 rounded-lg w-36"
                >
                  <option value="ALL">Todas las especies</option>
                  <option value="bovine">Bovinos</option>
                  <option value="equine">Equinos</option>
                  <option value="caprine">Caprinos</option>
                  <option value="pig">Porcinos</option>
                  <option value="canine">Caninos</option>
                  <option value="feline">Felinos</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>{selectedAnimalsToAssign.length} animal(es) seleccionados</span>
                <button
                  type="button"
                  onClick={handleSelectAllAssignFiltered}
                  className="text-emerald-700 hover:underline font-semibold"
                  disabled={availableAnimalsToAssign.length === 0}
                >
                  {availableAnimalsToAssign.length > 0 &&
                  availableAnimalsToAssign.every((a) => selectedAnimalsToAssign.includes(a.id))
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos los visibles'}
                </button>
              </div>

              {/* Lista de animales */}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2 min-h-56 max-h-72 bg-gray-50">
                {availableAnimalsToAssign.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    No hay más animales disponibles para asignar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableAnimalsToAssign.map((animal) => {
                      const isSelected = selectedAnimalsToAssign.includes(animal.id);
                      return (
                        <div
                          key={animal.id}
                          onClick={() => toggleSelectAnimalToAssign(animal.id)}
                          className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-emerald-700 shrink-0" />
                          ) : (
                            <Square size={18} className="text-gray-400 shrink-0" />
                          )}
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold truncate">{animal.name}</div>
                            <div className="text-[11px] text-gray-500 capitalize">
                              {animal.species} • {animal.breed}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-4 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedAnimalsToAssign.length === 0}
                  className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>
                    {submitting
                      ? 'Asignando...'
                      : `Asignar ${selectedAnimalsToAssign.length} Animal(es)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Iniciar Rotación de Pastoreo */}
      {isGrazingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Nueva Rotación de Pastoreo en {paddock.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Registra un lote de animales ingresando a este potrero.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGrazingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <GrazingForm
              initialPaddockId={paddock.id}
              onSubmitSuccess={handleGrazingCreated}
              onCancel={() => setIsGrazingModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Modal: Detalle de Animales en una Rotación */}
      {selectedActivityForDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Rotación #{selectedActivityForDetail.rotationNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Detalle del lote y fechas de pastoreo en {paddock.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivityForDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <span className="text-gray-500">Ingreso:</span>
                  <p className="font-semibold text-gray-800">
                    {formatDate(selectedActivityForDetail.entryDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Salida:</span>
                  <p className="font-semibold text-gray-800">
                    {formatDate(selectedActivityForDetail.exitDate)}
                  </p>
                </div>
              </div>

              {selectedActivityForDetail.observations && (
                <div>
                  <span className="font-bold text-gray-700">Observaciones:</span>
                  <p className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-600 mt-1">
                    {selectedActivityForDetail.observations}
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-gray-700 block mb-2">
                  Animales en este Lote ({selectedActivityForDetail.animalIds?.length || 0}):
                </span>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5 bg-gray-50">
                  {selectedActivityForDetail.animalIds?.map((animalId) => {
                    const foundAnimal = allAnimals.find((a) => a.id === animalId);
                    return (
                      <div
                        key={animalId}
                        className="bg-white p-2 rounded border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-800">
                            {foundAnimal?.name || 'Animal'}
                          </span>
                          {foundAnimal && (
                            <span className="text-gray-500 text-[11px] ml-1.5">
                              ({foundAnimal.species} • {foundAnimal.breed})
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/animals/${animalId}/history`}
                          className="text-emerald-700 hover:underline text-[11px]"
                        >
                          Ver perfil
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedActivityForDetail(null)}
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 px-4 rounded-lg"
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

export default PaddockDetailView;
