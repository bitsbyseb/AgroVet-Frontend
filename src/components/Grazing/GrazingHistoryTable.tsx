import React, { useMemo } from 'react';
import type { IGrazingHistoryItem, IPaddock, Animal } from '../../types';
import {
  Layers,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  RefreshCw,
  Eye,
  Inbox,
  Users,
  Timer
} from 'lucide-react';

export interface GrazingHistoryTableProps {
  items: IGrazingHistoryItem[];
  paddocks: IPaddock[];
  animals: Animal[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onSelectRecord?: (record: IGrazingHistoryItem) => void;
}

export const GrazingHistoryTable: React.FC<GrazingHistoryTableProps> = ({
  items,
  paddocks,
  animals,
  isLoading,
  error,
  onRetry,
  onSelectRecord
}) => {
  const paddockMap = useMemo(() => {
    const map = new Map<string, IPaddock>();
    paddocks.forEach((p) => map.set(p.id, p));
    return map;
  }, [paddocks]);

  const animalMap = useMemo(() => {
    const map = new Map<string, Animal>();
    animals.forEach((a) => map.set(a.id, a));
    return map;
  }, [animals]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estado de Error
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-red-200 p-8 text-center my-6">
        <div className="inline-flex p-3 bg-red-100 text-red-600 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar el historial</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        )}
      </div>
    );
  }

  // Estado de Carga
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12 text-center my-6">
        <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4 animate-spin">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Cargando historial de pastoreo...</h3>
        <p className="text-xs text-gray-500">Calculando tiempos de permanencia y procesando rotaciones</p>
      </div>
    );
  }

  // Estado de Lista Vacía
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12 text-center my-6">
        <div className="inline-flex p-3 bg-gray-100 text-gray-500 rounded-full mb-4">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">No se encontraron actividades</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          No hay rotaciones de pastoreo registradas que coincidan con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">Potrero</th>
              <th className="py-3.5 px-4">Lote / Animales</th>
              <th className="py-3.5 px-4 text-center">Rotación</th>
              <th className="py-3.5 px-4">Fecha Ingreso</th>
              <th className="py-3.5 px-4">Fecha Salida / Estado</th>
              <th className="py-3.5 px-4">Tiempo de Permanencia</th>
              <th className="py-3.5 px-4">Observaciones</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {items.map((item) => {
              const paddock = paddockMap.get(item.paddockId);
              const formattedEntry = formatDate(item.entryDate);
              const formattedExit = formatDate(item.exitDate);
              const isOngoing = item.permanenceTime?.inProgress || !item.exitDate;

              return (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Potrero */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {paddock?.name || 'Potrero no identificado'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Capacidad: {paddock?.capacity || 'N/A'} anim.
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Lote / Animales */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">
                        {item.animalIds?.length || 0} animal{(item.animalIds?.length || 0) !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    {/* Previa de hasta 2 animales */}
                    <div className="text-xs text-gray-500 truncate max-w-[180px]">
                      {item.animalIds
                        ?.slice(0, 2)
                        .map((id) => animalMap.get(id)?.name || id.substring(0, 6))
                        .join(', ')}
                      {(item.animalIds?.length || 0) > 2 ? ' ...' : ''}
                    </div>
                  </td>

                  {/* Número de Rotación */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200">
                      #{item.rotationNumber}
                    </span>
                  </td>

                  {/* Fecha Entrada */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-xs">{formattedEntry || 'Sin fecha'}</span>
                    </div>
                  </td>

                  {/* Fecha Salida / Estado */}
                  <td className="py-3.5 px-4">
                    {isOngoing ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <Activity className="w-3.5 h-3.5" />
                        <span>En curso</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-xs">{formattedExit || 'Finalizado'}</span>
                      </div>
                    )}
                  </td>

                  {/* Tiempo de Permanencia */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                      <Timer className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{item.permanenceTime?.formatted || 'No calculado'}</span>
                    </div>
                  </td>

                  {/* Observaciones */}
                  <td className="py-3.5 px-4">
                    <p className="text-xs text-gray-600 line-clamp-2 max-w-[200px]" title={item.observations || ''}>
                      {item.observations || <span className="text-gray-400 italic">Sin observaciones</span>}
                    </p>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-center">
                    {onSelectRecord && (
                      <button
                        onClick={() => onSelectRecord(item)}
                        className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Ver detalle del registro"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
