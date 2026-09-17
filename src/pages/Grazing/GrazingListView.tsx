import React, { useEffect, useState, useMemo } from 'react';
import { grazingService, paddockService, animalService, authService } from '../../services/api';
import type { IGrazingActivity, IPaddock, Animal } from '../../types';
import { GrazingForm } from '../../components/Grazing/GrazingForm';
import {
  Plus,
  Compass,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  X,
  RefreshCw,
  Hash,
  Eye
} from 'lucide-react';

export const GrazingListView: React.FC = () => {
  const [activities, setActivities] = useState<IGrazingActivity[]>([]);
  const [paddocks, setPaddocks] = useState<IPaddock[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [paddockFilter, setPaddockFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<IGrazingActivity | null>(null);

  const currentUser = authService.getCurrentUser();
  const canManage = currentUser?.role === 'zootechnician' || currentUser?.role === 'administrator';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [activitiesData, paddocksData, animalsData] = await Promise.all([
        grazingService.getGrazingActivities().catch(() => [] as IGrazingActivity[]),
        paddockService.getPaddocks().catch(() => [] as IPaddock[]),
        animalService.list().catch(() => [] as Animal[])
      ]);

      setActivities(activitiesData);
      setPaddocks(paddocksData);
      setAnimals(animalsData);
    } catch (err: unknown) {
      console.error('Error cargando actividades de pastoreo:', err);
      const errObj = err as { response?: { data?: { error?: string } } };
      setError(errObj.response?.data?.error || 'No se pudieron cargar las actividades de pastoreo.');
    } finally {
      setLoading(false);
    }
  };

  // Map rápido de potreros y animales por ID
  const paddockMap = useMemo(() => {
    const map = new Map<string, IPaddock>();
    paddocks.forEach(p => map.set(p.id, p));
    return map;
  }, [paddocks]);

  const animalMap = useMemo(() => {
    const map = new Map<string, Animal>();
    animals.forEach(a => map.set(a.id, a));
    return map;
  }, [animals]);

  // Métricas rápidas de pastoreo
  const stats = useMemo(() => {
    const active = activities.filter(a => !a.exitDate || new Date(a.exitDate) > new Date());
    const paddocksInGrazing = new Set(active.map(a => a.paddockId)).size;
    const totalAnimalsGrazing = active.reduce((sum, a) => sum + (a.animalIds?.length || 0), 0);

    return {
      activeCount: active.length,
      paddocksCount: paddocksInGrazing,
      animalsGrazingCount: totalAnimalsGrazing,
      totalCount: activities.length
    };
  }, [activities]);

  // Filtrado de actividades
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const paddock = paddockMap.get(act.paddockId);
      const paddockName = paddock?.name || '';
      const observations = act.observations || '';

      const matchesSearch =
        paddockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        observations.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.rotationNumber.toString().includes(searchTerm);

      const matchesPaddock = paddockFilter === 'ALL' || act.paddockId === paddockFilter;

      const isActive = !act.exitDate || new Date(act.exitDate) > new Date();
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') matchesStatus = isActive;
      if (statusFilter === 'COMPLETED') matchesStatus = !isActive;

      return matchesSearch && matchesPaddock && matchesStatus;
    });
  }, [activities, paddockMap, searchTerm, paddockFilter, statusFilter]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'En curso';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const calculateDays = (entryStr: string, exitStr?: string | null) => {
    try {
      const start = new Date(entryStr).getTime();
      const end = exitStr ? new Date(exitStr).getTime() : Date.now();
      const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    setSuccessMsg('Actividad de pastoreo registrada exitosamente.');
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass className="text-emerald-700" size={32} />
            Actividades de Pastoreo
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Control y registro rotacional de lotes de animales en los potreros.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={20} />
            Registrar Pastoreo
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: 'var(--error)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tarjetas de Resumen / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '10px', color: '#2e7d32' }}>
            <Clock size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.activeCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rotaciones Activas</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '10px', color: '#0284c7' }}>
            <Layers size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.paddocksCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Potreros Ocupados</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '10px', color: '#d97706' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.animalsGrazingCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Animales en Pastoreo</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#f3e8ff', padding: '12px', borderRadius: '10px', color: '#9333ea' }}>
            <Hash size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.totalCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Histórico</div>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1, minWidth: '280px' }}>
            {/* Input de Búsqueda */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por potrero, observación o rotación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Filtro por Potrero */}
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '180px' }}
              value={paddockFilter}
              onChange={(e) => setPaddockFilter(e.target.value)}
            >
              <option value="ALL">Todos los potreros</option>
              {paddocks.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Filtro por Estado */}
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'COMPLETED')}
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">En Curso (Activos)</option>
              <option value="COMPLETED">Finalizados</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={loadData}
              className="btn"
              style={{ backgroundColor: '#f0f0f0', padding: '8px 12px' }}
              title="Refrescar datos"
            >
              <RefreshCw size={16} />
            </button>
            <div style={{ display: 'flex', backgroundColor: '#e0e0e0', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'table' ? 'white' : 'transparent',
                  fontWeight: viewMode === 'table' ? 'bold' : 'normal'
                }}
              >
                Tabla
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'cards' ? 'white' : 'transparent',
                  fontWeight: viewMode === 'cards' ? 'bold' : 'normal'
                }}
              >
                Tarjetas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal: Lista / Tabla */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Cargando actividades de pastoreo...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Compass size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 15px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
            No se encontraron actividades de pastoreo
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 20px' }}>
            {searchTerm || paddockFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Aún no se han registrado rotaciones de pastoreo en el sistema.'}
          </p>
          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Registrar Primera Rotación
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Modo Tabla */
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Potrero</th>
                  <th>Rotación</th>
                  <th>Lote de Animales</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th>Permanencia</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((act) => {
                  const paddock = paddockMap.get(act.paddockId);
                  const isActive = !act.exitDate || new Date(act.exitDate) > new Date();
                  const days = calculateDays(act.entryDate, act.exitDate);

                  return (
                    <tr key={act.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{paddock?.name || 'Potrero desconocido'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {paddock?.area ? `${paddock.area} ha • ` : ''}Aforo: {paddock?.capacity || '-'}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f3e8ff',
                          color: '#7e22ce',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          Rotación #{act.rotationNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={16} color="var(--text-muted)" />
                          <span style={{ fontWeight: 600 }}>{act.animalIds?.length || 0}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>animales</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{formatDate(act.entryDate)}</td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {isActive ? (
                          <span style={{ color: '#2e7d32', fontStyle: 'italic' }}>En curso</span>
                        ) : (
                          formatDate(act.exitDate)
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {days} {days === 1 ? 'día' : 'días'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: isActive ? '#e8f5e9' : '#f5f5f5',
                          color: isActive ? '#2e7d32' : '#616161'
                        }}>
                          {isActive ? 'Activo' : 'Finalizado'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedActivityForDetail(act)}
                          className="btn"
                          style={{ padding: '6px 10px', backgroundColor: '#f0f0f0', fontSize: '0.8rem' }}
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                          Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Modo Tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((act) => {
            const paddock = paddockMap.get(act.paddockId);
            const isActive = !act.exitDate || new Date(act.exitDate) > new Date();
            const days = calculateDays(act.entryDate, act.exitDate);

            return (
              <div key={act.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {paddock?.name || 'Potrero'}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f3e8ff',
                      color: '#7e22ce',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      marginTop: '4px'
                    }}>
                      Rotación #{act.rotationNumber}
                    </span>
                  </div>

                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: isActive ? '#e8f5e9' : '#f5f5f5',
                    color: isActive ? '#2e7d32' : '#616161'
                  }}>
                    {isActive ? 'Activo' : 'Finalizado'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Users size={16} />
                    <span>Lote: <strong>{act.animalIds?.length || 0} animales asignados</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Calendar size={16} />
                    <span>Ingreso: {formatDate(act.entryDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Calendar size={16} />
                    <span>Salida: {formatDate(act.exitDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Clock size={16} />
                    <span>Permanencia: <strong>{days} {days === 1 ? 'día' : 'días'}</strong></span>
                  </div>
                </div>

                {act.observations && (
                  <div style={{
                    fontSize: '0.8rem',
                    backgroundColor: '#fafafa',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: '#555',
                    borderLeft: '3px solid var(--primary)',
                    marginTop: 'auto'
                  }}>
                    {act.observations}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedActivityForDetail(act)}
                  className="btn"
                  style={{ width: '100%', backgroundColor: '#f0f0f0', marginTop: '8px' }}
                >
                  <Eye size={16} />
                  Ver Animales y Detalle
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar Nueva Actividad de Pastoreo */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass className="text-emerald-700" size={24} />
                Registrar Actividad de Pastoreo
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <GrazingForm
              onSubmitSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Modal: Detalle de Actividad y Animales asignados */}
      {selectedActivityForDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                Detalle de Pastoreo - {paddockMap.get(selectedActivityForDetail.paddockId)?.name || 'Potrero'}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedActivityForDetail(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                <div><strong>Rotación:</strong> #{selectedActivityForDetail.rotationNumber}</div>
                <div>
                  <strong>Estado:</strong>{' '}
                  {!selectedActivityForDetail.exitDate ? (
                    <span style={{ color: '#2e7d32', fontWeight: 600 }}>Activo (En curso)</span>
                  ) : (
                    <span style={{ color: '#616161' }}>Finalizado</span>
                  )}
                </div>
                <div><strong>Fecha de Ingreso:</strong> {formatDate(selectedActivityForDetail.entryDate)}</div>
                <div><strong>Fecha de Salida:</strong> {formatDate(selectedActivityForDetail.exitDate)}</div>
              </div>

              {selectedActivityForDetail.observations && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Observaciones:</strong>
                  <p style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '6px', marginTop: '4px', fontSize: '0.875rem' }}>
                    {selectedActivityForDetail.observations}
                  </p>
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>
                  Animales en este Lote ({selectedActivityForDetail.animalIds?.length || 0}):
                </strong>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}>
                  {selectedActivityForDetail.animalIds?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay animales asociados.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                      {selectedActivityForDetail.animalIds.map((animalId) => {
                        const animal = animalMap.get(animalId);
                        return (
                          <div key={animalId} style={{ padding: '6px 10px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600 }}>{animal?.name || animalId}</div>
                            {animal && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {animal.species} • {animal.breed}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedActivityForDetail(null)}
                  className="btn"
                  style={{ backgroundColor: '#eeeeee' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrazingListView;
