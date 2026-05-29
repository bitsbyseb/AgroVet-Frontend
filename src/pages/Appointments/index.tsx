import React, { useEffect, useState } from 'react';
import { appointmentService, animalService, authService } from '../../services/api';
import type { Appointment, AppointmentInput, Animal } from '../../types';
import { Plus, X, Save, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

const AppointmentsList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AppointmentInput>({
    date: '',
    reason: '',
    animalId: '',
    status: 'Scheduled'
  });

  const currentUser = authService.getCurrentUser();
  const canManageAppointments = currentUser?.role === 'veterinarian';

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsData, animalsData] = await Promise.all([
        appointmentService.list(),
        canManageAppointments ? animalService.list() : Promise.resolve([])
      ]);
      setAppointments(appointmentsData);
      setAnimals(animalsData);
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

      console.error('Error fetching appointments:', err);
      setError('No se pudo cargar la lista de consultas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert local datetime to ISO string
    const isoDate = new Date(formData.date).toISOString();
    
    setSaving(true);
    try {
      await appointmentService.create({
        ...formData,
        date: isoDate
      });
      setShowAddForm(false);
      setFormData({
        date: '',
        reason: '',
        animalId: '',
        status: 'Scheduled'
      });
      fetchData(); // Refresh list
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar la cita.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await appointmentService.updateStatus(id, { status: newStatus });
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: newStatus as "Scheduled" | "Completed" | "Cancelled" } : app
      ));
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al actualizar el estado de la cita.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return { bg: '#e8f5e9', color: '#2e7d32', label: 'Completada' };
      case 'Cancelled': return { bg: '#ffebee', color: '#c62828', label: 'Cancelada' };
      default: return { bg: '#e3f2fd', color: '#1565c0', label: 'Programada' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} />;
      case 'Cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start" style={{ marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Consultas Médicas</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de citas y programación</p>
        </div>
        
        {canManageAppointments && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <Plus size={20} />
            Nueva Consulta
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '30px', border: '1px solid var(--primary)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }} className="flex items-center gap-10">
              <Calendar size={20} />
              Programar Nueva Consulta
            </h2>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-20">
              <div className="form-group">
                <label>Animal</label>
                <select 
                  className="form-control"
                  value={formData.animalId}
                  onChange={(e) => setFormData({...formData, animalId: e.target.value})}
                  required
                >
                  <option value="">-- Seleccionar Animal --</option>
                  {animals.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name} ({animal.species})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Motivo de la Consulta</label>
              <textarea 
                className="form-control" 
                rows={2}
                placeholder="Ej: Revisión general, Vacunación, Enfermedad..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
              />
            </div>

            <div className="flex gap-10 justify-end" style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={20} />
                {saving ? 'Programando...' : 'Programar Consulta'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Cargando consultas...</p>
        ) : appointments.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay consultas programadas.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Animal</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  {canManageAppointments && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const statusInfo = getStatusColor(appointment.status);
                  const dateObj = new Date(appointment.date);
                  
                  return (
                    <tr key={appointment.id}>
                      <td>
                        <div style={{ fontWeight: '500' }}>
                          {dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--primary)' }}>
                        {appointment.animal ? appointment.animal.name : 'Desconocido'}
                      </td>
                      <td>{appointment.reason}</td>
                      <td>
                        <span style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem',
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          width: 'max-content',
                          fontWeight: '500'
                        }}>
                          {getStatusIcon(appointment.status)}
                          {statusInfo.label}
                        </span>
                      </td>
                      {canManageAppointments && (
                        <td>
                          {appointment.status === 'Scheduled' && (
                            <div className="flex gap-10">
                              <button 
                                className="btn btn-sm" 
                                style={{ color: '#2e7d32', backgroundColor: '#e8f5e9' }}
                                onClick={() => handleStatusChange(appointment.id, 'Completed')}
                                title="Marcar como Completada"
                              >
                                <CheckCircle size={16} /> Completar
                              </button>
                              <button 
                                className="btn btn-sm" 
                                style={{ color: '#c62828', backgroundColor: '#ffebee' }}
                                onClick={() => handleStatusChange(appointment.id, 'Cancelled')}
                                title="Cancelar Consulta"
                              >
                                <XCircle size={16} /> Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      )}
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

export default AppointmentsList;
