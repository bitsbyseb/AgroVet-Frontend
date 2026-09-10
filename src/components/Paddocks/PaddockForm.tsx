import React, { useState, useEffect } from 'react';
import type { IPaddock, PaddockInput, PaddockStatus } from '../../types';
import { Save, X } from 'lucide-react';

interface PaddockFormProps {
  initialData?: Partial<IPaddock>;
  onSubmit: (data: PaddockInput) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export const PaddockForm: React.FC<PaddockFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PaddockInput>({
    name: '',
    capacity: 10,
    area: null,
    status: 'ACTIVE',
    description: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        capacity: initialData.capacity ?? 10,
        area: initialData.area ?? null,
        status: initialData.status || 'ACTIVE',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'El nombre del potrero es obligatorio.';
    }

    if (formData.capacity === undefined || formData.capacity === null || formData.capacity < 0) {
      newErrors.capacity = 'La capacidad debe ser un número entero mayor o igual a 0.';
    } else if (!Number.isInteger(Number(formData.capacity))) {
      newErrors.capacity = 'La capacidad debe ser un número entero.';
    }

    if (formData.area !== null && formData.area !== undefined && (formData.area as unknown as string) !== '') {
      if (Number(formData.area) < 0) {
        newErrors.area = 'El área no puede ser negativa.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: PaddockInput = {
      name: formData.name.trim(),
      capacity: Number(formData.capacity),
      area: formData.area ? Number(formData.area) : null,
      status: formData.status as PaddockStatus,
      description: formData.description?.trim() || null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '15px' }}>
        {isEditing ? 'Actualizar Potrero' : 'Registrar Nuevo Potrero'}
      </h3>

      <div className="form-group">
        <label>Nombre del Potrero</label>
        <input
          type="text"
          className="form-control"
          placeholder="Ej: Potrero San Isidro Norte"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          disabled={loading}
          required
        />
        {errors.name && (
          <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
            {errors.name}
          </p>
        )}
      </div>

      <div className="flex gap-10">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Capacidad Máxima (Aforo)</label>
          <input
            type="number"
            min="0"
            step="1"
            className="form-control"
            placeholder="Ej: 25"
            value={formData.capacity}
            onChange={(e) => {
              setFormData({ ...formData, capacity: e.target.value === '' ? ('' as unknown as number) : Number(e.target.value) });
              if (errors.capacity) setErrors({ ...errors, capacity: '' });
            }}
            disabled={loading}
            required
          />
          {errors.capacity && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.capacity}
            </p>
          )}
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Área (Hectáreas / ha)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            placeholder="Ej: 8.5"
            value={formData.area ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              setFormData({ ...formData, area: val });
              if (errors.area) setErrors({ ...errors, area: '' });
            }}
            disabled={loading}
          />
          {errors.area && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.area}
            </p>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Estado Operativo</label>
        <select
          className="form-control"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as PaddockStatus })}
          disabled={loading}
          required
        >
          <option value="ACTIVE">Activo (Disponible para pastoreo)</option>
          <option value="RESTING">En Descanso (Recuperación de pasto)</option>
          <option value="MAINTENANCE">En Mantenimiento (Cercado / Fumigación)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Descripción y Observaciones</label>
        <textarea
          className="form-control"
          rows={3}
          placeholder="Ej: Pastura estrella y brachiaria, cuenta con bebedero automático y sombra natural."
          value={formData.description ?? ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="flex gap-10" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn"
            style={{ color: 'var(--text-muted)' }}
            disabled={loading}
          >
            <X size={18} />
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          <Save size={18} />
          {loading ? 'Guardando...' : isEditing ? 'Actualizar Potrero' : 'Registrar Potrero'}
        </button>
      </div>
    </form>
  );
};

export default PaddockForm;
