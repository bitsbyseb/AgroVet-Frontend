import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { animalService, ownerService, paddockService, authService } from '../../services/api';
import { SpeciesType, AnimalType, Gender } from '../../types';
import type { Owner, AnimalInput, IPaddock } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';

const CreateAnimal: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [canFetchOwners, setCanFetchOwners] = useState(true);
  const [formData, setFormData] = useState<AnimalInput>({
    name: '',
    species: '',
    animalType: '',
    breed: '',
    gender: '',
    birthDate: '',
    color: '',
    ownerId: '',
    paddockId: ''
  });
  const [loading, setLoading] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [paddocksLoading, setPaddocksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'zootechnician') {
      setCanFetchOwners(false);
      setOwnersLoading(false);
    } else {
      const fetchOwners = async () => {
        try {
          const data = await ownerService.list();
          setOwners(data);
          setCanFetchOwners(true);
        } catch (err: unknown) {
          setCanFetchOwners(false);
        } finally {
          setOwnersLoading(false);
        }
      };
      fetchOwners();
    }

    const fetchPaddocks = async () => {
      try {
        const data = await paddockService.getPaddocks();
        setPaddocks(data);
      } catch (err: unknown) {
        console.error('Error al cargar potreros:', err);
      } finally {
        setPaddocksLoading(false);
      }
    };
    fetchPaddocks();
  }, [user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerId.trim()) {
      setError('Debes ingresar o seleccionar un propietario.');
      return;
    }
    if (!formData.birthDate) {
      setError('Debes ingresar una fecha de nacimiento válida.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const birthDateString = formData.birthDate.includes('T')
        ? formData.birthDate
        : `${formData.birthDate}T00:00:00.000Z`;

      const dataToSubmit: AnimalInput = {
        ...formData,
        birthDate: birthDateString,
        paddockId: formData.paddockId ? formData.paddockId : null
      };

      await animalService.create(dataToSubmit);
      navigate('/animals');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al registrar animal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/animals')}
        className="btn"
        style={{ marginBottom: '20px', color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={20} />
        Regresar
      </button>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px' }}>Registrar Nuevo Animal</h1>

        {error && (
          <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Animal</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Bessie"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-10">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Especie</label>
              <select
                className="form-control"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                required
              >
                <option value="">Seleccionar especie</option>
                <option value={SpeciesType.CANINE}>Canino</option>
                <option value={SpeciesType.FELINE}>Felino</option>
                <option value={SpeciesType.BOVINE}>Bovino</option>
                <option value={SpeciesType.CAPRINE}>Caprino</option>
                <option value={SpeciesType.EQUINE}>Equino</option>
                <option value={SpeciesType.POULTRY}>Ave de corral</option>
                <option value={SpeciesType.PIG}>Porcino</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Género</label>
              <select
                className="form-control"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
              >
                <option value="">Seleccionar género</option>
                <option value={Gender.MALE}>Macho</option>
                <option value={Gender.FEMALE}>Hembra</option>
              </select>
            </div>
          </div>

          <div className="flex gap-10">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Raza</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Holstein"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Color</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Blanco con negro"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-10">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo de Entorno</label>
              <select
                className="form-control"
                value={formData.animalType}
                onChange={(e) => setFormData({ ...formData, animalType: e.target.value })}
                required
              >
                <option value="">Seleccionar entorno</option>
                <option value={AnimalType.URBAN}>Urbano</option>
                <option value={AnimalType.RURAL}>Rural</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Nacimiento</label>
              <input
                type="date"
                className="form-control"
                value={formData.birthDate}
                min="2000-01-01"
                max="2026-09-09"
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Propietario</label>
            {canFetchOwners ? (
              <select
                className="form-control"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                required
                disabled={ownersLoading}
              >
                <option value="">{ownersLoading ? 'Cargando propietarios...' : 'Seleccione un propietario'}</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.name} ({owner.document})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                placeholder="Ingrese el ID del propietario"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label>Potrero (Opcional)</label>
            <select
              className="form-control"
              value={formData.paddockId || ''}
              onChange={(e) => setFormData({ ...formData, paddockId: e.target.value || null })}
              disabled={paddocksLoading}
            >
              <option value="">{paddocksLoading ? 'Cargando potreros...' : 'Sin potrero asignado (Opcional)'}</option>
              {paddocks.map(paddock => (
                <option key={paddock.id} value={paddock.id}>
                  {paddock.name} (Capacidad: {paddock.capacity} - Estado: {paddock.status})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar Animal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAnimal;
