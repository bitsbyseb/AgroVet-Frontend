import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  Calendar,
  Syringe,
  Stethoscope,
  Pill,
  Utensils,
  PawPrint,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Info
} from 'lucide-react';
import type { OwnerAnimal, OwnerReminderDTO } from '../../types';
import { getOwnerAnimals, getOwnerReminders } from '../../services/ownerService';

type TabCategory = 'all' | 'vaccination' | 'appointment' | 'deworming' | 'alimentation';
type UrgencyStatus = 'OVERDUE' | 'TODAY' | 'SOON' | 'FUTURE';

interface UrgencyInfo {
  status: UrgencyStatus;
  label: string;
  badgeClass: string;
  diffDays: number;
}

export const Reminders: React.FC = () => {
  const [animals, setAnimals] = useState<OwnerAnimal[]>([]);
  const [reminders, setReminders] = useState<OwnerReminderDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<TabCategory>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'OVERDUE' | 'SOON'>('ALL');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRemindersData(selectedAnimalId);
  }, [selectedAnimalId]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [animalsData, remindersData] = await Promise.all([
        getOwnerAnimals(),
        getOwnerReminders(selectedAnimalId === 'ALL' ? undefined : selectedAnimalId)
      ]);
      setAnimals(animalsData);
      setReminders(remindersData);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al cargar los datos de recordatorios.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemindersData = async (animalId: string) => {
    setRefreshing(true);
    try {
      const data = await getOwnerReminders(animalId === 'ALL' ? undefined : animalId);
      setReminders(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al actualizar los recordatorios.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRemindersData(selectedAnimalId);
  };

  /**
   * Determina la urgencia y estado relativo de la fecha de vencimiento.
   */
  const getUrgencyInfo = (dueDateStr: string): UrgencyInfo => {
    const due = new Date(dueDateStr);
    const now = new Date();

    // Normalizar a inicio del día para cálculo exacto de días
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const diffMs = startOfDue - startOfToday;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'OVERDUE',
        label: `Vencido (${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'})`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        diffDays
      };
    }
    if (diffDays === 0) {
      return {
        status: 'TODAY',
        label: '¡Vence Hoy!',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
        diffDays
      };
    }
    if (diffDays <= 7) {
      return {
        status: 'SOON',
        label: `Próximo (en ${diffDays} ${diffDays === 1 ? 'día' : 'días'})`,
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        diffDays
      };
    }
    return {
      status: 'FUTURE',
      label: `En ${diffDays} días`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      diffDays
    };
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-CO', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * Clasificación por categoría de recordatorio.
   */
  const matchesCategory = (reminder: OwnerReminderDTO, cat: TabCategory): boolean => {
    if (cat === 'all') return true;
    const normCategory = reminder.category?.toLowerCase() || '';
    const normTitle = reminder.title?.toLowerCase() || '';
    const normDesc = reminder.description?.toLowerCase() || '';

    if (cat === 'deworming') {
      return (
        normCategory === 'deworming' ||
        normTitle.includes('desparasit') ||
        normDesc.includes('desparasit')
      );
    }
    if (cat === 'vaccination') {
      const isDeworming =
        normTitle.includes('desparasit') || normDesc.includes('desparasit');
      return normCategory === 'vaccination' && !isDeworming;
    }
    if (cat === 'appointment') {
      return normCategory === 'appointment' || normCategory === 'cita';
    }
    if (cat === 'alimentation') {
      return (
        normCategory === 'alimentation' ||
        normCategory === 'alimentación' ||
        normCategory === 'dieta'
      );
    }
    return normCategory === cat;
  };

  // Filtrado compuesto
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      // 1. Categoría
      if (!matchesCategory(rem, activeTab)) return false;

      // 2. Filtro de urgencia
      const urgency = getUrgencyInfo(rem.dueDate);
      if (urgencyFilter === 'OVERDUE' && urgency.status !== 'OVERDUE') return false;
      if (urgencyFilter === 'SOON' && !(urgency.status === 'TODAY' || urgency.status === 'SOON')) {
        return false;
      }

      // 3. Búsqueda de texto
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const inTitle = rem.title.toLowerCase().includes(query);
        const inDesc = rem.description.toLowerCase().includes(query);
        const inAnimal = rem.animalName.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inAnimal) return false;
      }

      return true;
    });
  }, [reminders, activeTab, urgencyFilter, searchTerm]);

  // Contadores para pestañas y KPIs
  const counts = useMemo(() => {
    let overdueCount = 0;
    let soonCount = 0;
    let vaccinesCount = 0;
    let appointmentsCount = 0;
    let dewormingCount = 0;
    let dietCount = 0;

    reminders.forEach((r) => {
      const u = getUrgencyInfo(r.dueDate);
      if (u.status === 'OVERDUE') overdueCount++;
      if (u.status === 'TODAY' || u.status === 'SOON') soonCount++;

      if (matchesCategory(r, 'vaccination')) vaccinesCount++;
      if (matchesCategory(r, 'appointment')) appointmentsCount++;
      if (matchesCategory(r, 'deworming')) dewormingCount++;
      if (matchesCategory(r, 'alimentation')) dietCount++;
    });

    return {
      total: reminders.length,
      overdueCount,
      soonCount,
      vaccinesCount,
      appointmentsCount,
      dewormingCount,
      dietCount
    };
  }, [reminders]);

  /**
   * Retorna metadatos visuales según la categoría (Icono, color de acento, etiqueta).
   */
  const getCategoryMeta = (reminder: OwnerReminderDTO) => {
    const isDeworming =
      reminder.category?.toLowerCase() === 'deworming' ||
      reminder.title.toLowerCase().includes('desparasit') ||
      reminder.description.toLowerCase().includes('desparasit');

    if (isDeworming) {
      return {
        label: 'Desparasitación',
        icon: Pill,
        colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800'
      };
    }

    switch (reminder.category?.toLowerCase()) {
      case 'vaccination':
        return {
          label: 'Vacunación',
          icon: Syringe,
          colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          badgeBg: 'bg-indigo-100 text-indigo-800'
        };
      case 'appointment':
        return {
          label: 'Cita / Control',
          icon: Stethoscope,
          colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeBg: 'bg-blue-100 text-blue-800'
        };
      case 'alimentation':
        return {
          label: 'Alimentación',
          icon: Utensils,
          colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badgeBg: 'bg-emerald-100 text-emerald-800'
        };
      default:
        return {
          label: 'Recordatorio',
          icon: Bell,
          colorClass: 'text-slate-600 bg-slate-50 border-slate-200',
          badgeBg: 'bg-slate-100 text-slate-800'
        };
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── Encabezado Principal ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-xs">
              <Bell size={26} className="text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Recordatorios y Notificaciones
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-0.5">
                Seguimiento integral de vacunación, controles veterinarios, desparasitación y dietas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs transition-colors disabled:opacity-50"
            title="Recargar recordatorios"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* ─── Alertas / Errores ─── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">No se pudieron cargar los recordatorios</p>
            <p className="text-sm text-rose-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchInitialData}
            className="text-xs font-semibold underline text-rose-800 hover:text-rose-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ─── Tarjetas de Resumen Rápido (KPIs) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Activos
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{counts.total}</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <Bell size={20} />
          </div>
        </div>

        {/* Vencidos */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            urgencyFilter === 'OVERDUE'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-gray-200 hover:border-rose-200'
          }`}
        >
          <div>
            <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">
              Vencidos / Urgentes
            </p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{counts.overdueCount}</p>
          </div>
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Próximos 7 días */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'SOON' ? 'ALL' : 'SOON')}
          className={`p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            urgencyFilter === 'SOON'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-gray-200 hover:border-amber-200'
          }`}
        >
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">
              Próximos (7 Días)
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{counts.soonCount}</p>
          </div>
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        {/* Vacunaciones */}
        <div
          onClick={() => setActiveTab(activeTab === 'vaccination' ? 'all' : 'vaccination')}
          className={`p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'vaccination'
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400'
              : 'bg-white border-gray-200 hover:border-indigo-200'
          }`}
        >
          <div>
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
              Vacunas Pendientes
            </p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{counts.vaccinesCount}</p>
          </div>
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <Syringe size={20} />
          </div>
        </div>
      </div>

      {/* ─── Barra de Filtros: Selector de Animal y Búsqueda (ASIDGA-174 / ASIDGA-175) ─── */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Selector de Animal (ASIDGA-174) */}
          <div className="flex-1 max-w-md">
            <label
              htmlFor="animalSelect"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              Filtrar por Animal:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <PawPrint size={18} />
              </div>
              <select
                id="animalSelect"
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all"
              >
                <option value="ALL">🐾 Todos mis animales ({animals.length})</option>
                {animals.map((an) => (
                  <option key={an.id} value={an.id}>
                    {an.name} ({an.breed || 'Sin raza'}) - {an.species}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Búsqueda por texto */}
          <div className="flex-1 max-w-md">
            <label
              htmlFor="searchInput"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              Buscar en recordatorios:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                id="searchInput"
                type="text"
                placeholder="Buscar por título, medicamento o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all"
              />
            </div>
          </div>

          {/* Botón de limpiar filtros activos */}
          {(selectedAnimalId !== 'ALL' || activeTab !== 'all' || urgencyFilter !== 'ALL' || searchTerm !== '') && (
            <div className="self-end md:self-auto flex items-end">
              <button
                onClick={() => {
                  setSelectedAnimalId('ALL');
                  setActiveTab('all');
                  setUrgencyFilter('ALL');
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* ─── Pestañas Dinámicas por Categoría (ASIDGA-176 a ASIDGA-179) ─── */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>Todos</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'all' ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {counts.total}
            </span>
          </button>

          {/* Vacunas (ASIDGA-176) */}
          <button
            onClick={() => setActiveTab('vaccination')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'vaccination'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Syringe size={16} />
            <span>Vacunaciones</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'vaccination' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {counts.vaccinesCount}
            </span>
          </button>

          {/* Citas / Controles (ASIDGA-177) */}
          <button
            onClick={() => setActiveTab('appointment')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'appointment'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Stethoscope size={16} />
            <span>Citas / Controles</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'appointment' ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {counts.appointmentsCount}
            </span>
          </button>

          {/* Desparasitaciones (ASIDGA-178) */}
          <button
            onClick={() => setActiveTab('deworming')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'deworming'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Pill size={16} />
            <span>Desparasitaciones</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'deworming' ? 'bg-amber-700 text-amber-100' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {counts.dewormingCount}
            </span>
          </button>

          {/* Alimentación (ASIDGA-179) */}
          <button
            onClick={() => setActiveTab('alimentation')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'alimentation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Utensils size={16} />
            <span>Alimentación</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'alimentation' ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {counts.dietCount}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Listado de Recordatorios ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
              <div className="h-14 w-full bg-gray-100 rounded-md" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-28 bg-gray-200 rounded-md" />
                <div className="h-4 w-20 bg-gray-200 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReminders.length === 0 ? (
        /* Estado Vacío */
        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
            ¡Todo al día! No hay recordatorios pendientes
          </h3>
          <p className="text-gray-600 max-w-md mx-auto text-sm md:text-base mb-6">
            {activeTab !== 'all' || selectedAnimalId !== 'ALL' || urgencyFilter !== 'ALL'
              ? 'No se encontraron eventos para los filtros seleccionados. Intenta restablecer los filtros para ver todos tus recordatorios.'
              : 'Tus animales se encuentran al día con sus vacunas, citas y controles veterinarios registrados.'}
          </p>
          {(activeTab !== 'all' || selectedAnimalId !== 'ALL' || urgencyFilter !== 'ALL' || searchTerm !== '') && (
            <button
              onClick={() => {
                setSelectedAnimalId('ALL');
                setActiveTab('all');
                setUrgencyFilter('ALL');
                setSearchTerm('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Filter size={16} />
              <span>Ver todos los recordatorios</span>
            </button>
          )}
        </div>
      ) : (
        /* Tarjetas de Recordatorios */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReminders.map((reminder) => {
            const urgency = getUrgencyInfo(reminder.dueDate);
            const categoryMeta = getCategoryMeta(reminder);
            const CategoryIcon = categoryMeta.icon;

            return (
              <div
                key={reminder.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Badge de Categoría */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryMeta.colorClass}`}
                    >
                      <CategoryIcon size={14} />
                      <span>{categoryMeta.label}</span>
                    </span>

                    {/* Badge de Urgencia / Tiempo */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${urgency.badgeClass}`}
                    >
                      {urgency.status === 'OVERDUE' && <AlertTriangle size={12} />}
                      {urgency.status === 'TODAY' && <Clock size={12} />}
                      <span>{urgency.label}</span>
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-2">
                    {reminder.title}
                  </h3>

                  {/* Descripción */}
                  <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                    {reminder.description || 'Sin descripción adicional disponible.'}
                  </p>
                </div>

                {/* Pie de la Tarjeta: Animal y Fecha */}
                <div className="px-5 py-3.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  {/* Animal Vinculado */}
                  <div className="flex items-center gap-1.5 font-medium text-gray-800 truncate pr-2">
                    <PawPrint size={14} className="text-emerald-600 shrink-0" />
                    <span className="truncate" title={reminder.animalName}>
                      {reminder.animalName}
                    </span>
                  </div>

                  {/* Fecha Programada */}
                  <div className="flex items-center gap-1.5 text-gray-500 shrink-0 font-medium">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatDate(reminder.dueDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Nota informativa para el usuario ─── */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-xs md:text-sm text-emerald-900">
        <Info size={18} className="shrink-0 mt-0.5 text-emerald-700" />
        <p>
          <strong>Consejo para la salud de tus animales:</strong> Los recordatorios se generan de manera automática en base al historial veterinario, los planes de vacunación y las indicaciones dietarias registradas por el personal médico y zootécnico. Consulta periódicamente esta sección para asegurar las dosis preventivas en las fechas correspondientes.
        </p>
      </div>
    </div>
  );
};

export default Reminders;
