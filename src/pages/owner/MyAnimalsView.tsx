import React, { useEffect, useState } from 'react';
import {
  PawPrint,
  HeartPulse,
  Calendar,
  Tag,
  Dna,
  FileText,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import type { OwnerAnimal } from '../../types';
import { getOwnerAnimals } from '../../services/ownerService';
import OwnerMedicalHistoryModal from '../../components/owner/OwnerMedicalHistoryModal';

export const MyAnimalsView: React.FC = () => {
  const [animals, setAnimals] = useState<OwnerAnimal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAnimal, setSelectedAnimal] = useState<OwnerAnimal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchMyAnimals();
  }, []);

  const fetchMyAnimals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOwnerAnimals();
      setAnimals(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al cargar la lista de animales propios.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = (animal: OwnerAnimal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

  const handleCloseHistory = () => {
    setIsModalOpen(false);
    setSelectedAnimal(null);
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

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dateStr: string): string | null => {
    try {
      const birth = new Date(dateStr);
      if (isNaN(birth.getTime())) return null;
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      if (years > 0) {
        return `${years} ${years === 1 ? 'año' : 'años'}${months > 0 ? `, ${months}m` : ''}`;
      }
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } catch {
      return null;
    }
  };

  const filteredAnimals = animals.filter((animal) => {
    const q = searchTerm.toLowerCase();
    return (
      animal.name.toLowerCase().includes(q) ||
      animal.breed.toLowerCase().includes(q) ||
      animal.species.toLowerCase().includes(q) ||
      animal.color.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <PawPrint className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Mis Animales
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Portal del Propietario · Consulta y seguimiento de tus animales
              </p>
            </div>
          </div>
        </div>

        {/* Botón de Refrescar */}
        <button
          type="button"
          onClick={fetchMyAnimals}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Barra de Búsqueda / Filtro rápido */}
      {!loading && animals.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, raza o especie..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Mostrando {filteredAnimals.length} de {animals.length}{' '}
            {animals.length === 1 ? 'animal registrado' : 'animales registrados'}
          </div>
        </div>
      )}

      {/* Estado de Error */}
      {error && !loading && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-900">
              Ocurrió un problema al obtener tus animales
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchMyAnimals}
              className="mt-3 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Estado de Carga (Skeletons) */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-gray-200 rounded-md" />
                    <div className="w-16 h-3 bg-gray-100 rounded-md" />
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full" />
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="w-full h-3 bg-gray-100 rounded-md" />
                <div className="w-3/4 h-3 bg-gray-100 rounded-md" />
                <div className="w-1/2 h-3 bg-gray-100 rounded-md" />
              </div>
              <div className="w-full h-10 bg-gray-200 rounded-xl pt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Lista Vacía */}
      {!loading && !error && animals.length === 0 && (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300 p-8">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
            <PawPrint className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            No tienes animales registrados aún
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
            Cuando la clínica o el administrador de AgroVet registre animales
            asociados a tu cuenta de propietario, los verás listados aquí para
            consultar su estado de salud e historia clínica.
          </p>
        </div>
      )}

      {/* Sin resultados tras filtrar */}
      {!loading && !error && animals.length > 0 && filteredAnimals.length === 0 && (
        <div className="py-12 text-center bg-white rounded-2xl border border-gray-200 p-8">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-gray-800">
            No se encontraron animales
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Ningún animal coincide con la búsqueda &quot;{searchTerm}&quot;.
          </p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="mt-3 text-xs text-emerald-600 font-bold hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Grid de Tarjetas de Animales */}
      {!loading && !error && filteredAnimals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => {
            const isActive = animal.status === 'active';
            const ageText = calculateAge(animal.birthDate);

            return (
              <div
                key={animal.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-emerald-300 transition-all duration-200 group"
              >
                <div>
                  {/* Encabezado de la Card: Icono, Nombre y Badge de Estado */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {animal.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                          {animal.name}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatSpecies(animal.species)}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Estatus de Salud / Estado */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border shadow-2xs ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      <HeartPulse
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                      />
                      <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                    </span>
                  </div>

                  {/* Detalles / Ficha Técnica del Animal */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-gray-100 text-xs">
                    {/* Raza */}
                    <div className="flex items-start gap-2">
                      <Dna className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-gray-400 block font-medium">
                          Raza
                        </span>
                        <span className="font-semibold text-gray-800">
                          {animal.breed || 'Sin especificar'}
                        </span>
                      </div>
                    </div>

                    {/* Género */}
                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-gray-400 block font-medium">
                          Género
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatGender(animal.gender)}
                        </span>
                      </div>
                    </div>

                    {/* Fecha de Nacimiento / Edad */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-gray-400 block font-medium">
                          Nacimiento
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatDate(animal.birthDate)}
                        </span>
                        {ageText && (
                          <span className="text-gray-400 block text-[10px]">
                            ({ageText})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Color */}
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0 mt-0.5 bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600">
                        C
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">
                          Color
                        </span>
                        <span className="font-semibold text-gray-800">
                          {animal.color || 'No registrado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acción: Botón Ver Historia Clínica */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(animal)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-colors shadow-xs shadow-emerald-600/20 group-hover:shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver historia clínica</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Historia Clínica (Solo Lectura) */}
      <OwnerMedicalHistoryModal
        isOpen={isModalOpen}
        onClose={handleCloseHistory}
        animal={selectedAnimal}
      />
    </div>
  );
};

export default MyAnimalsView;
