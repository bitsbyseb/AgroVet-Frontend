import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { animalService, paddockService, grazingService, authService } from '../../services/api';
import type { Animal, IPaddock, IGrazingActivity } from '../../types';
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
  Layers
} from 'lucide-react';

export const AnimalsList: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [grazingActivities, setGrazingActivities] = useState<IGrazingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    setUser(authService.getCurrentUser());
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalsData, paddocksData, grazingData] = await Promise.all([
        animalService.list().catch(() => [] as Animal[]),
        paddockService.getPaddocks().catch(() => [] as IPaddock[]),
        grazingService.getGrazingActivities().catch(() => [] as IGrazingActivity[])
      ]);
      setAnimals(animalsData);
      setPaddocks(paddocksData);
      setGrazingActivities(grazingData);
    } catch (err) {
      console.error('Error fetching animals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${name}? Esta acción no se puede deshacer.`)) {
      try {
        await animalService.delete(id);
        setAnimals(animals.filter(animal => animal.id !== id));
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Error al eliminar el animal.');
        setTimeout(() => setError(null), 5000);
      }
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

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const term = searchTerm.toLowerCase();
      const paddockName = animalPaddockMap.get(animal.id)?.paddock.name.toLowerCase() || '';
      return (
        animal.name.toLowerCase().includes(term) ||
        animal.species.toLowerCase().includes(term) ||
        animal.breed.toLowerCase().includes(term) ||
        paddockName.includes(term)
      );
    });
  }, [animals, searchTerm, animalPaddockMap]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Cat className="text-emerald-700" size={28} />
            Gestión de Animales
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Catálogo y control clínico, reproductivo, productivo y ubicación en potreros de los ejemplares registrados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg"
            title="Refrescar listado"
          >
            <RefreshCw size={16} />
          </button>
          <Link 
            to="/animals/new" 
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Plus size={18} />
            <span>Nuevo Registro</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="card bg-white shadow-xs border border-gray-100 p-4 rounded-xl">
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por nombre, especie, raza o potrero..."
            className="form-control px-4 py-2 w-full text-sm rounded-lg border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card bg-white shadow-xs border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3" />
            <p className="text-gray-500 text-sm">Cargando animales...</p>
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Cat size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No se encontraron animales</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm
                ? 'Intenta con otro término de búsqueda.'
                : 'No hay animales registrados aún. Comienza registrando un nuevo animal.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                  <th className="py-3.5 px-4 font-bold">Animal</th>
                  <th className="py-3.5 px-4 font-bold">Especie</th>
                  <th className="py-3.5 px-4 font-bold">Raza</th>
                  <th className="py-3.5 px-4 font-bold">Potrero Actual</th>
                  <th className="py-3.5 px-4 font-bold">Fecha Nac.</th>
                  <th className="py-3.5 px-4 font-bold">Estado</th>
                  <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredAnimals.map((animal) => {
                  const paddockInfo = animalPaddockMap.get(animal.id);

                  return (
                    <tr key={animal.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                            <Cat size={18} />
                          </div>
                          <span className="font-bold text-gray-900">{animal.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-gray-700">{animal.species}</td>
                      <td className="py-3.5 px-4 text-gray-700">{animal.breed}</td>
                      <td className="py-3.5 px-4">
                        {paddockInfo ? (
                          <Link
                            to={`/paddocks/${paddockInfo.paddock.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200"
                            title={
                              paddockInfo.isGrazing
                                ? `En Pastoreo: Rotación #${paddockInfo.rotationNumber}`
                                : 'Asignación Permanente al Potrero'
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
                          <span className="text-gray-400 text-xs italic">Sin potrero</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {animal.birthDate ? new Date(animal.birthDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          animal.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {animal.status === 'inactive' ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link 
                            to={`/animals/${animal.id}/history`} 
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition inline-flex items-center justify-center" 
                            title="Historial Médico"
                          >
                            <Stethoscope size={16} />
                          </Link>
                          <Link 
                            to={`/animals/${animal.id}/vaccines`} 
                            className="p-1.5 text-cyan-700 hover:bg-cyan-50 rounded-lg transition inline-flex items-center justify-center" 
                            title="Vacunas"
                          >
                            <Syringe size={16} />
                          </Link>
                          {user?.role !== 'veterinarian' && (
                            <Link 
                              to={`/animals/${animal.id}/diet`} 
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition inline-flex items-center justify-center" 
                              title="Plan de Alimentación"
                            >
                              <Utensils size={16} />
                            </Link>
                          )}
                          {animal.animalType === 'rural' && (
                            <>
                              <Link 
                                to={`/animals/${animal.id}/production`} 
                                className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg transition inline-flex items-center justify-center" 
                                title="Producción"
                              >
                                <Package size={16} />
                              </Link>
                              {user?.role !== 'veterinarian' && (
                                <Link 
                                  to={`/animals/${animal.id}/reproduction`} 
                                  className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition inline-flex items-center justify-center" 
                                  title="Reproducción"
                                >
                                  <Activity size={16} />
                                </Link>
                              )}
                            </>
                          )}
                          <Link 
                            to={`/animals/${animal.id}/edit`} 
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition inline-flex items-center justify-center" 
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <Link 
                            to={`/animals/${animal.id}/transfer`} 
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex items-center justify-center" 
                            title="Transferir Dueño"
                          >
                            <RefreshCw size={16} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(animal.id, animal.name)} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer" 
                            title="Eliminar"
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
    </div>
  );
};

export default AnimalsList;
