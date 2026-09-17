import React, { useState, useEffect, useMemo } from 'react';
import { paddockService, animalService, grazingService } from '../../services/api';
import type { IPaddock, Animal, GrazingActivityInput } from '../../types';
import { Save, X, AlertCircle, Search, Layers, Calendar, Hash, FileText, CheckSquare, Square, Info } from 'lucide-react';

interface GrazingFormProps {
  initialPaddockId?: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const GrazingForm: React.FC<GrazingFormProps> = ({
  initialPaddockId,
  onSubmitSuccess,
  onCancel,
  loading: externalLoading = false,
}) => {
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [selectedPaddockId, setSelectedPaddockId] = useState<string>(initialPaddockId || '');
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [entryDate, setEntryDate] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [exitDate, setExitDate] = useState<string>('');
  const [rotationNumber, setRotationNumber] = useState<number>(1);
  const [observations, setObservations] = useState<string>('');

  // Animal filter search
  const [animalSearch, setAnimalSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');

  // Field validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setDataLoading(true);
      setErrorMessage(null);
      const [paddocksData, animalsData] = await Promise.all([
        paddockService.getPaddocks(),
        animalService.list().catch(() => [] as Animal[])
      ]);
      setPaddocks(paddocksData);
      setAnimals(animalsData);

      if (!selectedPaddockId && paddocksData.length > 0) {
        // Seleccionar por defecto el primer potrero activo
        const firstActive = paddocksData.find(p => p.status !== 'MAINTENANCE');
        if (firstActive) setSelectedPaddockId(firstActive.id);
      }
    } catch (err: unknown) {
      console.error('Error cargando datos para pastoreo:', err);
      setErrorMessage('No se pudieron cargar los potreros o animales disponibles.');
    } finally {
      setDataLoading(false);
    }
  };

  const selectedPaddock = useMemo(() => {
    return paddocks.find(p => p.id === selectedPaddockId) || null;
  }, [paddocks, selectedPaddockId]);

  // Filtrado de animales para la lista de selección
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const matchesSearch = animal.name.toLowerCase().includes(animalSearch.toLowerCase()) ||
        animal.breed.toLowerCase().includes(animalSearch.toLowerCase());
      const matchesSpecies = speciesFilter === 'ALL' || animal.species === speciesFilter;
      return matchesSearch && matchesSpecies;
    });
  }, [animals, animalSearch, speciesFilter]);

  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimalIds((prev) =>
      prev.includes(animalId)
        ? prev.filter((id) => id !== animalId)
        : [...prev, animalId]
    );
    if (errors.animalIds) {
      setErrors((prev) => ({ ...prev, animalIds: '' }));
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredAnimals.map(a => a.id);
    const allSelected = filteredIds.every(id => selectedAnimalIds.includes(id));
    if (allSelected) {
      setSelectedAnimalIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedAnimalIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
    if (errors.animalIds) {
      setErrors(prev => ({ ...prev, animalIds: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedPaddockId) {
      newErrors.paddockId = 'Debe seleccionar un potrero.';
    } else if (selectedPaddock?.status === 'MAINTENANCE') {
      newErrors.paddockId = 'No se puede registrar pastoreo en un potrero en mantenimiento.';
    }

    if (selectedAnimalIds.length === 0) {
      newErrors.animalIds = 'Debe seleccionar al menos un animal para el pastoreo.';
    }

    if (!entryDate) {
      newErrors.entryDate = 'La fecha de entrada es obligatoria.';
    }

    if (exitDate) {
      const entryTime = new Date(entryDate).getTime();
      const exitTime = new Date(exitDate).getTime();
      if (exitTime < entryTime) {
        newErrors.exitDate = 'La fecha de salida no puede ser anterior a la de entrada.';
      }
    }

    if (!rotationNumber || rotationNumber < 1) {
      newErrors.rotationNumber = 'El número de rotación debe ser mayor o igual a 1.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload: GrazingActivityInput = {
        paddockId: selectedPaddockId,
        animalIds: selectedAnimalIds,
        entryDate: new Date(entryDate).toISOString(),
        exitDate: exitDate ? new Date(exitDate).toISOString() : null,
        rotationNumber: Number(rotationNumber),
        observations: observations.trim() || null,
      };

      await grazingService.createGrazingActivity(payload);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: unknown) {
      console.error('Error registrando actividad de pastoreo:', err);
      const errObj = err as { response?: { data?: { error?: string } } };
      setErrorMessage(errObj.response?.data?.error || 'Error al registrar la actividad de pastoreo.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = dataLoading || submitting || externalLoading;

  if (dataLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando potreros y animales...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <div style={{
          backgroundColor: '#ffebee',
          color: 'var(--error)',
          padding: '12px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selector de Potrero */}
      <div className="form-group">
        <label className="flex items-center gap-2 font-medium">
          <Layers size={18} className="text-emerald-700" />
          Potrero Destino
        </label>
        <select
          className="form-control"
          value={selectedPaddockId}
          onChange={(e) => {
            setSelectedPaddockId(e.target.value);
            if (errors.paddockId) setErrors({ ...errors, paddockId: '' });
          }}
          disabled={isLoading}
          required
        >
          <option value="">-- Seleccione un potrero --</option>
          {paddocks.map((paddock) => (
            <option
              key={paddock.id}
              value={paddock.id}
              disabled={paddock.status === 'MAINTENANCE'}
            >
              {paddock.name} - Capacidad: {paddock.capacity} animales ({paddock.status === 'MAINTENANCE' ? 'EN MANTENIMIENTO' : paddock.status === 'RESTING' ? 'EN DESCANSO' : 'ACTIVO'})
            </option>
          ))}
        </select>
        {errors.paddockId && (
          <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
            {errors.paddockId}
          </p>
        )}
        {selectedPaddock && (
          <div style={{
            marginTop: '8px',
            padding: '10px',
            backgroundColor: selectedPaddock.status === 'MAINTENANCE' ? '#fff3e0' : '#e8f5e9',
            borderRadius: '6px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} color={selectedPaddock.status === 'MAINTENANCE' ? '#e65100' : '#2e7d32'} />
            <span>
              Capacidad máxima: <strong>{selectedPaddock.capacity} animales</strong>.
              Área: <strong>{selectedPaddock.area ? `${selectedPaddock.area} ha` : 'No especificada'}</strong>.
              Animales asignados a este lote: <strong>{selectedAnimalIds.length}</strong>
              {selectedAnimalIds.length > selectedPaddock.capacity && (
                <span style={{ color: 'var(--error)', marginLeft: '8px', fontWeight: 'bold' }}>
                  (¡Aforo excedido!)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Asignación múltiple de animales */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="font-medium" style={{ margin: 0 }}>
            Asignar Animales al Lote ({selectedAnimalIds.length} seleccionados)
          </label>
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="btn"
            style={{ padding: '4px 10px', fontSize: '0.8rem', backgroundColor: '#e0e0e0', color: '#333' }}
            disabled={isLoading || filteredAnimals.length === 0}
          >
            {filteredAnimals.length > 0 && filteredAnimals.every(a => selectedAnimalIds.includes(a.id))
              ? 'Deseleccionar todos'
              : 'Seleccionar filtrados'}
          </button>
        </div>

        {/* Buscador y filtro de animales */}
        <div className="flex gap-2" style={{ marginBottom: '10px' }}>
          <div style={{ position: 'relative', flex: 2 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o raza..."
              value={animalSearch}
              onChange={(e) => setAnimalSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '32px' }}
              disabled={isLoading}
            />
          </div>
          <select
            className="form-control"
            style={{ flex: 1 }}
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            disabled={isLoading}
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

        {/* Lista de selección de animales */}
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '8px',
          backgroundColor: '#fafafa'
        }}>
          {filteredAnimals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px', fontSize: '0.9rem' }}>
              No se encontraron animales disponibles con los filtros aplicados.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
              {filteredAnimals.map((animal) => {
                const isSelected = selectedAnimalIds.includes(animal.id);
                return (
                  <div
                    key={animal.id}
                    onClick={() => toggleAnimalSelection(animal.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e8f5e9' : 'white',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid #e0e0e0',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare size={18} color="var(--primary)" />
                    ) : (
                      <Square size={18} color="#9e9e9e" />
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {animal.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {animal.species} • {animal.breed}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {errors.animalIds && (
          <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
            {errors.animalIds}
          </p>
        )}
      </div>

      {/* Fechas y Rotación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="flex items-center gap-2 font-medium">
            <Calendar size={16} className="text-emerald-700" />
            Fecha y Hora de Ingreso
          </label>
          <input
            type="datetime-local"
            className="form-control"
            value={entryDate}
            onChange={(e) => {
              setEntryDate(e.target.value);
              if (errors.entryDate) setErrors({ ...errors, entryDate: '' });
            }}
            disabled={isLoading}
            required
          />
          {errors.entryDate && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.entryDate}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="flex items-center gap-2 font-medium">
            <Calendar size={16} className="text-emerald-700" />
            Fecha y Hora de Salida (Opcional)
          </label>
          <input
            type="datetime-local"
            className="form-control"
            value={exitDate}
            onChange={(e) => {
              setExitDate(e.target.value);
              if (errors.exitDate) setErrors({ ...errors, exitDate: '' });
            }}
            disabled={isLoading}
          />
          {errors.exitDate && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.exitDate}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="flex items-center gap-2 font-medium">
            <Hash size={16} className="text-emerald-700" />
            Número de Rotación
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className="form-control"
            value={rotationNumber}
            onChange={(e) => {
              setRotationNumber(Number(e.target.value));
              if (errors.rotationNumber) setErrors({ ...errors, rotationNumber: '' });
            }}
            disabled={isLoading}
            required
          />
          {errors.rotationNumber && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.rotationNumber}
            </p>
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div className="form-group">
        <label className="flex items-center gap-2 font-medium">
          <FileText size={16} className="text-emerald-700" />
          Observaciones del Pastoreo
        </label>
        <textarea
          className="form-control"
          rows={3}
          placeholder="Ej: Estado de pastura alta, forraje abundante. Se complementa con sal mineralizada."
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn"
            style={{ backgroundColor: '#eeeeee', color: 'var(--text-muted)' }}
            disabled={isLoading}
          >
            <X size={18} />
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          <Save size={18} />
          {submitting ? 'Registrando...' : 'Registrar Actividad'}
        </button>
      </div>
    </form>
  );
};

export default GrazingForm;
