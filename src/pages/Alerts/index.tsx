import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Syringe,
  Pill,
  Stethoscope,
  Utensils,
  Baby,
  BarChart2,
  Compass,
  Check,
  Sparkles,
  Calendar,
  Mail,
  X
} from 'lucide-react';
import { alertService, animalService, authService } from '../../services/api';
import type { AlertRecord, AlertModuleType, AlertPriority, AlertStatus, Animal } from '../../types';

// ─── Module Metadata ──────────────────────────────────────────────────────────

const MODULE_VISUALS: Record<AlertModuleType, { icon: React.ReactNode; colorClass: string; borderClass: string; bgClass: string }> = {
  vaccination: {
    icon: <Syringe size={16} />,
    colorClass: 'text-sky-700',
    borderClass: 'border-l-sky-500',
    bgClass: 'bg-sky-50'
  },
  treatment: {
    icon: <Pill size={16} />,
    colorClass: 'text-amber-700',
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-amber-50'
  },
  control: {
    icon: <Stethoscope size={16} />,
    colorClass: 'text-emerald-700',
    borderClass: 'border-l-emerald-500',
    bgClass: 'bg-emerald-50'
  },
  feeding: {
    icon: <Utensils size={16} />,
    colorClass: 'text-orange-700',
    borderClass: 'border-l-orange-500',
    bgClass: 'bg-orange-50'
  },
  reproduction: {
    icon: <Baby size={16} />,
    colorClass: 'text-pink-700',
    borderClass: 'border-l-pink-500',
    bgClass: 'bg-pink-50'
  },
  production: {
    icon: <BarChart2 size={16} />,
    colorClass: 'text-indigo-700',
    borderClass: 'border-l-indigo-500',
    bgClass: 'bg-indigo-50'
  },
  grazing: {
    icon: <Compass size={16} />,
    colorClass: 'text-emerald-800',
    borderClass: 'border-l-emerald-700',
    bgClass: 'bg-emerald-50'
  }
};

const PRIORITY_BADGES: Record<AlertPriority, { badgeClass: string; icon: React.ReactNode }> = {
  high: {
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    icon: <AlertCircle size={14} className="text-red-600" />
  },
  medium: {
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <AlertTriangle size={14} className="text-amber-600" />
  },
  low: {
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock size={14} className="text-blue-600" />
  }
};

const AlertsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentUser = authService.getCurrentUser();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('pending');
  const [priorityFilter, setPriorityFilter] = useState<'all' | AlertPriority>('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | AlertModuleType>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal para generar alertas
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [selectedAnimalForGen, setSelectedAnimalForGen] = useState<string>('');
  const [daysAhead, setDaysAhead] = useState<number>(7);
  const [generating, setGenerating] = useState<boolean>(false);

  // Estados de marcado
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  // RBAC: Roles autorizados
  const canManageAlerts = currentUser && ['veterinarian', 'zootechnician', 'administrator'].includes(currentUser.role);

  useEffect(() => {
    fetchData();
  }, []);

  // Manejo de accesibilidad en modal (Escape y bloqueo de scroll)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showGenerateModal) {
        setShowGenerateModal(false);
      }
    };

    if (showGenerateModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showGenerateModal]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsData, animalsData] = await Promise.all([
        alertService.list(),
        animalService.list().catch(() => [])
      ]);
      setAlerts(alertsData);
      setAnimals(animalsData);
    } catch (err: unknown) {
      console.error('Error fetching alerts:', err);
      setError(t('alerts.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const alertsData = await alertService.list();
      setAlerts(alertsData);
    } catch {
      setError(t('alerts.errors.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      setMarkingId(alertId);
      setError(null);
      await alertService.markAsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'read' as AlertStatus } : a))
      );
      setActionSuccess(t('alerts.markAsRead'));
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error marking alert as read:', err);
      setError(t('alerts.errors.markFailed'));
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      setError(null);
      const res = await alertService.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, status: 'read' as AlertStatus })));
      setActionSuccess(`(${res.marked}) ${t('alerts.markAllAsRead')}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error marking all as read:', err);
      setError(t('alerts.errors.markAllFailed'));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleGenerateAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalForGen) return;

    try {
      setGenerating(true);
      setError(null);
      const res = await alertService.generate({
        animalId: selectedAnimalForGen,
        daysAhead: Number(daysAhead) || 7
      });
      setShowGenerateModal(false);
      setSelectedAnimalForGen('');
      setActionSuccess(t('alerts.evaluationCompleted', { count: res.generated }));
      setTimeout(() => setActionSuccess(null), 4000);
      await handleRefresh();
    } catch (err: unknown) {
      console.error('Error generating alerts:', err);
      setError(t('alerts.errors.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  // Animal map for fast lookup
  const animalMap = useMemo(() => {
    const map = new Map<string, Animal>();
    animals.forEach((a) => map.set(a.id, a));
    return map;
  }, [animals]);

  // Alertas filtradas
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Estado
      if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
      // Prioridad
      if (priorityFilter !== 'all' && alert.priority !== priorityFilter) return false;
      // Módulo
      if (moduleFilter !== 'all' && alert.moduleType !== moduleFilter) return false;
      // Término de búsqueda
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const animal = animalMap.get(alert.animalId);
        const animalName = animal ? animal.name.toLowerCase() : '';
        const msg = alert.message.toLowerCase();
        return msg.includes(term) || animalName.includes(term);
      }
      return true;
    });
  }, [alerts, statusFilter, priorityFilter, moduleFilter, searchTerm, animalMap]);

  // Contadores
  const pendingCount = useMemo(() => alerts.filter((a) => a.status === 'pending').length, [alerts]);
  const highPriorityPendingCount = useMemo(
    () => alerts.filter((a) => a.status === 'pending' && a.priority === 'high').length,
    [alerts]
  );
  const readCount = useMemo(() => alerts.filter((a) => a.status === 'read').length, [alerts]);

  if (!canManageAlerts) {
    return (
      <div className="card text-center py-16 px-4 bg-white rounded-xl shadow-xs border border-gray-100">
        <AlertTriangle size={48} className="text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-800">{t('alerts.restrictedTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('alerts.restrictedMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Encabezado Principal ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Bell className="text-emerald-700" size={28} />
            <span>{t('alerts.title')}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('alerts.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Sparkles size={16} />
            <span>{t('alerts.evaluateAnimal')}</span>
          </button>
        </div>
      </div>

      {/* ─── Mensajes de estado ────────────────────────────────────────────── */}
      {error && (
        <div role="alert" aria-live="assertive" className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div role="status" aria-live="polite" className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ─── Tarjetas de Resumen KPI ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('alerts.criticalPending')}</p>
            <p className="text-2xl font-extrabold text-red-600">{highPriorityPendingCount}</p>
          </div>
        </div>

        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('alerts.totalPending')}</p>
            <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
          </div>
        </div>

        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('alerts.reviewed')}</p>
            <p className="text-2xl font-extrabold text-emerald-700">{readCount}</p>
          </div>
        </div>
      </div>

      {/* ─── Barra de Filtros ──────────────────────────────────────────────── */}
      <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 space-y-3">
        {/* Pestañas de Estado */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={14} />
              <span>{t('alerts.pending')} ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('read')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'read'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>{t('alerts.read')} ({readCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{t('alerts.all')} ({alerts.length})</span>
            </button>
          </div>

          {pendingCount > 0 && statusFilter !== 'read' && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="btn text-xs py-1.5 px-3 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>{markingAll ? t('common.saving') : t('alerts.markAllAsRead')}</span>
            </button>
          )}
        </div>

        {/* Filtros secundarios: búsqueda, módulo y prioridad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              aria-label={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control w-full pl-9 text-xs bg-white"
            />
          </div>

          {/* Módulo */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={moduleFilter}
              aria-label={t('alerts.modules.all')}
              onChange={(e) => setModuleFilter(e.target.value as 'all' | AlertModuleType)}
              className="form-control w-full pl-8 text-xs bg-white"
            >
              <option value="all">{t('alerts.modules.all')}</option>
              <option value="vaccination">{t('alerts.modules.vaccination')}</option>
              <option value="treatment">{t('alerts.modules.treatment')}</option>
              <option value="control">{t('alerts.modules.control')}</option>
              <option value="feeding">{t('alerts.modules.feeding')}</option>
              <option value="reproduction">{t('alerts.modules.reproduction')}</option>
              <option value="production">{t('alerts.modules.production')}</option>
              <option value="grazing">{t('alerts.modules.grazing')}</option>
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <select
              value={priorityFilter}
              aria-label={t('alerts.priorities.all')}
              onChange={(e) => setPriorityFilter(e.target.value as 'all' | AlertPriority)}
              className="form-control w-full text-xs bg-white"
            >
              <option value="all">{t('alerts.priorities.all')}</option>
              <option value="high">{t('alerts.priorities.high')}</option>
              <option value="medium">{t('alerts.priorities.medium')}</option>
              <option value="low">{t('alerts.priorities.low')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Listado de Alertas ────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw className="animate-spin text-emerald-600" size={20} />
          <span>{t('common.loading')}</span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card text-center py-16 px-4 bg-white rounded-xl shadow-xs border border-gray-100">
          <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">{t('alerts.noAlerts')}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {searchTerm || moduleFilter !== 'all' || priorityFilter !== 'all'
              ? t('animals.emptySearch')
              : t('alerts.noAlerts')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const visual = MODULE_VISUALS[alert.moduleType] || {
              icon: <AlertCircle size={16} />,
              colorClass: 'text-gray-700',
              borderClass: 'border-l-gray-400',
              bgClass: 'bg-gray-50'
            };
            const priorityBadge = PRIORITY_BADGES[alert.priority] || PRIORITY_BADGES.medium;
            const animal = animalMap.get(alert.animalId);
            const isRead = alert.status === 'read';
            const isProcessing = markingId === alert.id;

            return (
              <div
                key={alert.id}
                className={`card bg-white rounded-xl shadow-xs border border-gray-100 border-l-4 ${visual.borderClass} p-4 transition hover:shadow-sm ${
                  isRead ? 'opacity-70 bg-gray-50/50' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  {/* Icono + Información Principal */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${visual.bgClass} ${visual.colorClass}`}>
                      {visual.icon}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Badges superiores */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.badgeClass}`}>
                          {priorityBadge.icon}
                          <span>{t('alerts.priorities.' + alert.priority)}</span>
                        </span>

                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${visual.bgClass} ${visual.colorClass}`}>
                          <span>{t('alerts.modules.' + alert.moduleType)}</span>
                        </span>

                        {animal && (
                          <span className="text-xs font-bold text-gray-800">
                            🐾 {animal.name} ({animal.species})
                          </span>
                        )}

                        {alert.emailSent && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full" title={t('alerts.emailSent')}>
                            <Mail size={12} className="text-gray-400" />
                            <span>{t('alerts.emailSent')}</span>
                          </span>
                        )}
                      </div>

                      {/* Mensaje descriptivo */}
                      <p className={`text-sm ${isRead ? 'text-gray-600 line-through' : 'text-gray-900 font-medium'} leading-snug`}>
                        {alert.message}
                      </p>

                      {/* Fecha de disparo */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={12} />
                        <span>
                          {new Date(alert.triggerDate).toLocaleDateString(i18n.language || 'es', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isRead ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
                        <Check size={14} />
                        <span>{t('alerts.read')}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        disabled={isProcessing}
                        className="btn bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-1.5 px-3 rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        title={t('alerts.markAsRead')}
                      >
                        <Check size={14} />
                        <span>{isProcessing ? t('common.saving') : t('alerts.markAsRead')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal para Evaluar/Generar Alertas ─────────────────────────────── */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGenerateModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-modal-title"
        >
          <div className="card bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 id="generate-modal-title" className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-700" />
                <span>{t('alerts.evaluateAnimal')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              {t('alerts.subtitle')}
            </p>

            <form onSubmit={handleGenerateAlerts} className="space-y-4">
              <div className="form-group mb-0">
                <label htmlFor="animal-select-gen" className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('animals.table.animal')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="animal-select-gen"
                  value={selectedAnimalForGen}
                  onChange={(e) => setSelectedAnimalForGen(e.target.value)}
                  className="form-control w-full text-sm bg-white"
                  required
                  aria-required="true"
                >
                  <option value="">{t('alerts.selectAnimal')}</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.species} - {a.breed})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-0">
                <label htmlFor="days-ahead-input" className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('alerts.daysAhead')}
                </label>
                <input
                  id="days-ahead-input"
                  type="number"
                  min="1"
                  max="90"
                  step="1"
                  value={daysAhead}
                  onChange={(e) => setDaysAhead(Math.min(90, Math.max(1, Number(e.target.value) || 1)))}
                  className="form-control w-full text-sm bg-white"
                  placeholder={t('alerts.daysAheadPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={generating || !selectedAnimalForGen}
                  className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  aria-busy={generating}
                >
                  <Sparkles size={14} />
                  <span>{generating ? t('common.loading') : t('alerts.evaluateAnimal')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsView;
