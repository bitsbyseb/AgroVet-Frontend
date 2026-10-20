import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ownerService, authService } from '../../services/api';
import type { Owner } from '../../types';
import { Plus, User as UserIcon, Edit2, Eye, Trash2, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';

const OwnersList: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'urban' | 'rural'>('all');
  const [user, setUser] = useState(authService.getCurrentUser());
  const isAdmin = user?.role === 'administrator';

  useEffect(() => {
    setUser(authService.getCurrentUser());
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ownerService.list();
      setOwners(data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al obtener el listado de propietarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${name}"?\n\nNota: La eliminación fallará si este propietario aún tiene animales asociados.`)) {
      try {
        await ownerService.delete(id);
        setOwners(prev => prev.filter(owner => owner.id !== id));
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Error al eliminar el propietario. Verifica que no tenga animales asociados.');
        setTimeout(() => setError(null), 6000);
      }
    }
  };

  const filteredOwners = useMemo(() => {
    return owners.filter(owner => {
      const matchesSearch =
        owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.phone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || owner.ownerType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [owners, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directorio de Propietarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión y registro de propietarios urbanos (mascotas) y rurales (productores agropecuarios)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOwners}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            title="Recargar datos"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <Link
              to="/owners/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
            >
              <Plus size={18} />
              <span>Nuevo Propietario</span>
            </Link>
          )}
        </div>
      </div>

      {/* Alerta de error */}
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

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, teléfono o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'urban' | 'rural')}
            className="py-2 px-3 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">Todos los ámbitos</option>
            <option value="urban">Urbano (Mascotas)</option>
            <option value="rural">Rural (Agropecuario)</option>
          </select>
        </div>
      </div>

      {/* Contenido Principal / Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-4 bg-gray-200 rounded-sm" />
                    <div className="w-24 h-3 bg-gray-100 rounded-sm" />
                  </div>
                </div>
                <div className="w-20 h-4 bg-gray-200 rounded-sm" />
                <div className="w-16 h-6 bg-gray-100 rounded-full" />
                <div className="w-24 h-8 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredOwners.length === 0 ? (
          <div className="text-center py-12 px-4">
            <UserIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No se encontraron propietarios</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm || typeFilter !== 'all'
                ? 'No hay registros que coincidan con los criterios de búsqueda o filtro seleccionados.'
                : 'Aún no se han registrado propietarios en el sistema.'}
            </p>
            {isAdmin && !searchTerm && typeFilter === 'all' && (
              <Link
                to="/owners/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                <span>Registrar primer propietario</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Propietario</th>
                  <th className="py-3.5 px-4">Identificación</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Dirección</th>
                  <th className="py-3.5 px-4">Ámbito</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOwners.map((owner) => {
                  const isRural = owner.ownerType === 'rural';
                  const initials = owner.name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={owner.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isRural ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {initials || <UserIcon size={14} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{owner.name}</p>
                            <p className="text-xs text-gray-500">{owner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-mono text-xs">
                        {owner.document}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs">
                        {owner.phone || 'Sin teléfono'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs max-w-xs truncate" title={owner.address}>
                        {owner.address}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isRural
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {isRural ? 'Rural' : 'Urbano'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/owners/${owner.id}/animals`}
                            className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Ver animales a cargo"
                          >
                            <Eye size={17} />
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                to={`/owners/${owner.id}/edit`}
                                className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                title="Editar propietario"
                              >
                                <Edit2 size={17} />
                              </Link>
                              <button
                                onClick={() => handleDelete(owner.id, owner.name)}
                                className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                title="Eliminar propietario"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
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

        {/* Footer con conteo */}
        {!loading && filteredOwners.length > 0 && (
          <div className="p-3 bg-gray-50/60 border-t border-gray-100 text-xs text-gray-500 text-right">
            Mostrando {filteredOwners.length} de {owners.length} propietarios registrados
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnersList;
