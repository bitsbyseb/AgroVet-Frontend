import React, { useEffect, useState } from 'react';
import { X, Calendar, Stethoscope, Pill, AlertCircle, Clock, FileText } from 'lucide-react';
import type { OwnerAnimal, OwnerMedicalHistoryEntry } from '../../types';
import { getOwnerAnimalMedicalHistory } from '../../services/ownerService';

interface OwnerMedicalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: OwnerAnimal | null;
}

export const OwnerMedicalHistoryModal: React.FC<OwnerMedicalHistoryModalProps> = ({
  isOpen,
  onClose,
  animal,
}) => {
  const [history, setHistory] = useState<OwnerMedicalHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && animal?.id) {
      fetchMedicalHistory(animal.id);
    } else {
      setHistory([]);
      setError(null);
    }
  }, [isOpen, animal?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const fetchMedicalHistory = async (animalId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOwnerAnimalMedicalHistory(animalId);
      // Ordenar por fecha descendente (más reciente primero)
      const sorted = [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setHistory(sorted);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'No fue posible cargar el historial clínico del animal.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !animal) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="modal-headline"
                  className="text-lg font-bold text-gray-900 tracking-tight"
                >
                  Historia Clínica
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Solo Lectura
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Paciente:{' '}
                <span className="font-semibold text-gray-700">
                  {animal.name}
                </span>{' '}
                · Raza: {animal.breed || 'Mestizo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido principal (Timeline de solo lectura) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">
                Cargando registros médicos...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800">
                  Error al cargar la información
                </h4>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchMedicalHistory(animal.id)}
                  className="mt-3 text-xs font-semibold text-red-700 hover:text-red-900 underline"
                >
                  Reintentar consulta
                </button>
              </div>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-gray-700">
                Sin antecedentes médicos
              </h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                Actualmente no hay consultas o historias clínicas registradas
                para <span className="font-medium text-gray-700">{animal.name}</span>.
              </p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-200">
              {history.map((record, index) => (
                <div key={record.id || index} className="relative group">
                  {/* Punto del timeline */}
                  <div className="absolute -left-[23px] sm:-left-[27px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-emerald-600 shadow-xs">
                    <Clock className="w-3 h-3" />
                  </div>

                  {/* Card del evento médico */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow">
                    {/* Fecha y motivo */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(record.date)}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        Registro #{history.length - index}
                      </span>
                    </div>

                    {/* Motivo */}
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="text-emerald-600">●</span> Motivo:{' '}
                        {record.reason}
                      </h4>
                    </div>

                    {/* Diagnóstico */}
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Diagnóstico Veterinario
                      </p>
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">
                        {record.diagnosis}
                      </p>
                    </div>

                    {/* Tratamiento prescrito */}
                    <div className="mt-3 flex items-start gap-2 text-sm text-gray-700">
                      <Pill className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-900">
                          Tratamiento:{' '}
                        </span>
                        <span>{record.treatment || 'No especificado'}</span>
                      </div>
                    </div>

                    {/* Observaciones (si las hay) */}
                    {record.observations && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-amber-900">
                        <span className="font-bold">Observaciones: </span>
                        <span>{record.observations}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer del Modal (Solo lectura: único botón para cerrar) */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            data-testid="modal-footer-close-btn"
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerMedicalHistoryModal;
