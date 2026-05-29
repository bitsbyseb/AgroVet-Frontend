import React, { useEffect, useState } from 'react';
import { foodService, authService } from '../../services/api';
import type { Food, FoodInput } from '../../types';
import { Plus, X, Save, Leaf, Wheat, Database } from 'lucide-react';

const FoodsList: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FoodInput>({
    name: '',
    type: 'Concentrado',
    description: ''
  });

  const currentUser = authService.getCurrentUser();
  const canAddFood = currentUser?.role === 'zootechnician' || currentUser?.role === 'administrator';

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const data = await foodService.list();
      setFoods(data);
    } catch (err) {
      // eslint-disable-next-line no-unused-vars
      console.error('Error fetching foods:', err);
      setError('No se pudo cargar el catálogo de alimentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await foodService.create(formData);
      setShowAddForm(false);
      setFormData({
        name: '',
        type: 'Concentrado',
        description: ''
      });
      fetchFoods(); // Refresh list
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar el alimento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start" style={{ marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Catálogo de Alimentos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de concentrados, forrajes y suplementos</p>
        </div>
        
        {canAddFood && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ backgroundColor: '#2e7d32' }}>
            <Plus size={20} />
            Nuevo Alimento
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
              <Wheat size={20} />
              Agregar Nuevo Alimento
            </h2>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-20">
              <div className="form-group">
                <label>Nombre del Alimento</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Concentrado Lechero 16%"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select 
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="Concentrado">Concentrado</option>
                  <option value="Forraje">Forraje</option>
                  <option value="Suplemento">Suplemento</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Descripción</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  placeholder="Ej: Delicioso concentrado con contenido nutritivo..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex gap-10 justify-end" style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2e7d32' }} disabled={saving}>
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Alimento'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-20">
        {loading ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>Cargando catálogo...</p>
          </div>
        ) : foods.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <Database size={48} style={{ color: '#cfd8dc', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No hay alimentos registrados en el catálogo.</p>
          </div>
        ) : (
          foods.map((food) => (
            <div key={food.id} className="card flex flex-column" style={{ borderTop: '4px solid #2e7d32', height: '100%' }}>
              <div className="flex items-center gap-10" style={{ marginBottom: '15px' }}>
                <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '50%' }}>
                  <Leaf size={24} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1b5e20' }}>
                    {food.name}
                  </h3>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    backgroundColor: '#f1f8e9',
                    color: '#558b2f',
                    marginTop: '4px'
                  }}>
                    {food.type}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Descripción: </span>
                  <p style={{ fontSize: '0.9rem', backgroundColor: '#fafafa', padding: '8px', borderRadius: '4px', marginTop: '4px', border: '1px solid #eeeeee' }}>
                    {food.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FoodsList;
