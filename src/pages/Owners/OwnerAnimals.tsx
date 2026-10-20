import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { ownerService, authService } from '../../services/api';
import type { Animal, Owner } from '../../types';
import { 
  ArrowLeft, PawPrint, Phone, Mail, MapPin, 
  Plus, Edit2, Calendar, FileText, HeartPulse, AlertCircle, RefreshCw 
} from 'lucide-react';

const OwnerAnimals: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'administrator';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [ownerData, animalsData] = await Promise.all([
        ownerService.getById(id),
        ownerService.getAnimals(id)
      ]);
      setOwner(ownerData);
      setAnimals(animalsData);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al cargar los datos del propietario y sus animales asociados.');
    } finally {
      setLoading(false);
    }
  };

  const formatSpecies = (species: string): string => {
    const map: Record<string, string> = {
      canine: 'Canino',
      feline: 'Felino',
      bovine: 'Bovino',
      caprine: 'Caprino',
      equine: 'Equino',
      poultry: 'Avícola',
      pig: 'Porcino',
    };
    return map[species.toLowerCase()] || species;
  };

  const formatGender = (gender: string): string => {
    if (gender.toLowerCase() === 'male') return 'Macho';
    if (gender.toLowerCase() === 'female') return 'Hembra';
    return gender;
  };

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <button 
        onClick={() => navigate('/owners')} 
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Volver a la lista de propietarios</span>
      </button>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1 text-sm">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Ficha del Propietario */}
      {owner && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-xs ${
                owner.ownerType === 'rural' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
              }`}>
                {owner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{owner.name}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    owner.ownerType === 'rural'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    {owner.ownerType === 'rural' ? 'Ámbito Rural' : 'Ámbito Urbano'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Doc. Identidad: {owner.document}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Recargar animales"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              {isAdmin && (
                <Link
                  to={`/owners/${owner.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Edit2 size={15} />
                  <span>Editar Datos</span>
                </Link>
              )}
            </div>
          </div>

          {/* Detalles de contacto del propietario */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-gray-400 block text-[11px]">Teléfono</span>
                <span className="font-medium text-gray-800">{owner.phone || 'No registrado'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-gray-400 block text-[11px]">Correo</span>
                <span className="font-medium text-gray-800">{owner.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-gray-400 block text-[11px]">Dirección o Predio</span>
                <span className="font-medium text-gray-800 truncate" title={owner.address}>{owner.address}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Animales Vinculados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PawPrint size={20} className="text-emerald-700" />
              <span>Animales a su cargo ({animals.length})</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Listado de animales registrados bajo la titularidad de este propietario
            </p>
          </div>

          <Link
            to="/animals/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            <Plus size={16} />
            <span>Registrar Animal</span>
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-gray-50 rounded-xl" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Estado Vacío */}
        {!loading && animals.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <PawPrint size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No hay animales vinculados</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Actualmente este propietario no cuenta con animales registrados en el sistema.
            </p>
            <Link
              to="/animals/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={16} />
              <span>Registrar animal para este propietario</span>
            </Link>
          </div>
        )}

        {/* Grid de Animales */}
        {!loading && animals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {animals.map((animal) => {
              const isActive = animal.status === 'active';
              return (
                <div
                  key={animal.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-200"
                >
                  <div>
                    {/* Header de la card */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-base">
                          {animal.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight">
                            {animal.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatSpecies(animal.species)} · {animal.breed || 'Sin raza'}
                          </span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <HeartPulse size={12} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                        <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </div>

                    {/* Datos del animal */}
                    <div className="grid grid-cols-2 gap-2.5 py-3 border-t border-b border-gray-100 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Género</span>
                        <span className="font-semibold text-gray-800">{formatGender(animal.gender)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Color</span>
                        <span className="font-semibold text-gray-800">{animal.color || 'No registrado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Nacimiento</span>
                        <span className="font-semibold text-gray-800">
                          {animal.birthDate ? new Date(animal.birthDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Tipo</span>
                        <span className="font-semibold text-gray-800 capitalize">{animal.animalType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones directas al animal */}
                  <div className="pt-4 flex items-center gap-2">
                    <Link
                      to={`/animals/${animal.id}/history`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors"
                      title="Historia clínica"
                    >
                      <FileText size={14} />
                      <span>Historia</span>
                    </Link>
                    <Link
                      to={`/animals/${animal.id}/vaccines`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                      title="Plan de vacunación"
                    >
                      <Calendar size={14} />
                      <span>Vacunas</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerAnimals;
