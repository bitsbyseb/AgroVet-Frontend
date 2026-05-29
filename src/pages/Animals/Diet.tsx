import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, foodService, authService } from '../../services/api';
import type { Animal, DietRecord, DietInput, Food } from '../../types';
import { ArrowLeft, Plus, Save, X, Utensils, Wheat } from 'lucide-react';

const AnimalDiet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [diet, setDiet] = useState<DietRecord[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<DietInput>({
    foodId: '',
    quantity: 0,
    frequency: 'Diario'
  });

  // Only Zootechnician can add diet records
  const canAddDiet = currentUser?.role === 'zootechnician';

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const animalData = await animalService.getById(id!);
      setAnimal(animalData);
      
      try {
        const [dietData, foodsData] = await Promise.all([
          animalService.getDiet(id!),
          foodService.list()
        ]);
        setDiet(dietData);
        setFoods(foodsData);
      } catch (err: unknown) {
        if ((err as { response?: { data?: { error?: string }, status?: number } }).response?.status === 403) {
          setForbidden(true);
        } else {
          throw err;
        }
      }
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

      console.error('Error fetching diet:', err);
      setError('No se pudo cargar la información de alimentación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    setSaving(true);
    try {
      await animalService.addDiet(id, formData);
      setShowAddForm(false);
      setFormData({
        foodId: '',
        quantity: 0,
        frequency: 'Diario'
      });
      fetchData(); // Refresh list
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar el registro de alimentación.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando datos de alimentación...</div>;

  if (forbidden) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)' }}>Acceso Denegado</h2>
        <p>Tu rol actual no tiene permisos para ver o modificar la alimentación.</p>
        <button onClick={() => navigate('/animals')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Volver a Animales
        </button>
      </div>
    );
  }

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
            Plan de Alimentación: <span style={{ color: 'var(--primary)' }}>{animal?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddDiet && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ backgroundColor: '#f57c00' }}>
            <Plus size={20} />
            Asignar Dieta
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '30px', border: '1px solid #f57c00' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f57c00' }} className="flex items-center gap-10">
              <Utensils size={20} />
              Asignar Nuevo Plan de Alimentación
            </h2>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-20">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Alimento</label>
                <select 
                  className="form-control"
                  value={formData.foodId}
                  onChange={(e) => setFormData({...formData, foodId: e.target.value})}
                  required
                >
                  <option value="">-- Seleccionar Alimento --</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} ({food.type})
                    </option>
                  ))}
                </select>
                {foods.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: '5px' }}>
                    No hay alimentos registrados en el catálogo. Registra un alimento primero.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Cantidad (kg)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-control" 
                  placeholder="Ej: 2.5"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Frecuencia</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Diario, 2 veces al día..."
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex gap-10 justify-end" style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn">
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ backgroundColor: '#f57c00' }} 
                disabled={saving || foods.length === 0}
              >
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Dieta'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-column gap-20">
        {diet.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <Utensils size={48} style={{ color: '#cfd8dc', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No hay plan de alimentación registrado para este animal.</p>
          </div>
        ) : (
          diet.map((record) => (
            <div key={record.id} className="card" style={{ borderLeft: '4px solid #f57c00' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: '15px' }}>
                <div className="flex items-center gap-10">
                  <div style={{ backgroundColor: '#fff3e0', color: '#f57c00', padding: '8px', borderRadius: '8px' }}>
                    <Wheat size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {record.food?.name || 'Alimento Desconocido'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Asignado el {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-20" style={{ marginTop: '15px', backgroundColor: '#fafafa', padding: '15px', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cantidad</h4>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f57c00' }}>{record.quantity} kg</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frecuencia</h4>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{record.frequency}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnimalDiet;
