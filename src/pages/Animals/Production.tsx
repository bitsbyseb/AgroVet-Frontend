import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, authService } from '../../services/api';
import type { Animal, ProductionRecord, ProductionInput } from '../../types';
import { ArrowLeft, Plus, Save, X, Calendar, Package, Droplet, Scale } from 'lucide-react';

const AnimalProduction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductionInput>({
    date: new Date().toISOString().split('T')[0],
    type: 'Leche',
    quantity: 0,
    unit: 'Litros',
    purpose: 'milk'
  });

  // Only Zootechnician can add production records
  const canAddProduction = currentUser?.role === 'zootechnician';

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalData, productionData] = await Promise.all([
        animalService.getById(id!),
        animalService.getProduction(id!)
      ]);
      setAnimal(animalData);
      setProduction(productionData);
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

      console.error('Error fetching production:', err);
      setError('No se pudo cargar la información de producción.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    const submissionData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        quantity: Number(formData.quantity)
    };

    setSaving(true);
    try {
      await animalService.addProduction(id, submissionData);
      setShowAddForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Leche',
        quantity: 0,
        unit: 'Litros',
        purpose: 'milk'
      });
      fetchData(); // Refresh list
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar el registro de producción.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando datos de producción...</div>;

  return (
    <div>
      <div className="flex items-center gap-10" style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/animals')} 
          className="btn btn-sm" 
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={20} />
          Regresar
        </button>
      </div>

      <div className="flex justify-between items-start" style={{ marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            Registro de Producción: <span style={{ color: 'var(--primary)' }}>{animal?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddProduction && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ backgroundColor: '#2e7d32' }}>
            <Plus size={20} />
            Nuevo Registro
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '30px', border: '1px solid #2e7d32' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }} className="flex items-center gap-10">
              <Package size={20} />
              Agregar Nuevo Registro de Producción
            </h2>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-20">
              <div className="form-group">
                <label>Fecha de Registro</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de Producto</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Leche, Carne, Huevos..."
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cantidad</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-control" 
                  placeholder="Ej: 15.5"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unidad de Medida</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Litros, Kg..."
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Propósito</label>
                <select 
                  className="form-control"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  required
                >
                  <option value="milk">Leche</option>
                  <option value="meat">Carne</option>
                  <option value="eggs">Huevos</option>
                  <option value="wool">Lana</option>
                  <option value="dual">Doble Propósito</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            <div className="flex gap-10 justify-end" style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2e7d32' }} disabled={saving}>
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-column gap-20">
        {production.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <Package size={48} style={{ color: '#cfd8dc', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No hay registros de producción para este animal.</p>
          </div>
        ) : (
          production.map((record) => (
            <div key={record.id} className="card" style={{ borderLeft: '4px solid #2e7d32' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: '15px' }}>
                <div className="flex items-center gap-10">
                  <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '8px', borderRadius: '8px' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {record.type}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-20" style={{ marginTop: '15px', backgroundColor: '#fafafa', padding: '15px', borderRadius: '8px' }}>
                <div className="flex items-center gap-10">
                  <Scale size={20} style={{ color: '#546e7a' }} />
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cantidad</h4>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }}>{record.quantity} {record.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <Droplet size={20} style={{ color: '#546e7a' }} />
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</h4>
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{record.type}</p>
                    {record.purpose && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Propósito: {record.purpose}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnimalProduction;
