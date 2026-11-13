import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { authService, adminService } from '../../services/api';
import type { AdminIndicators } from '../../types';
import {
  Users,
  Cat,
  Activity,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Beef,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';

const speciesColors: Record<string, { bg: string; bar: string; text: string }> = {
  bovine: { bg: 'bg-emerald-50 border-emerald-100', bar: 'bg-emerald-600', text: 'text-emerald-700' },
  equine: { bg: 'bg-amber-50 border-amber-100', bar: 'bg-amber-600', text: 'text-amber-700' },
  canine: { bg: 'bg-sky-50 border-sky-100', bar: 'bg-sky-600', text: 'text-sky-700' },
  feline: { bg: 'bg-purple-50 border-purple-100', bar: 'bg-purple-600', text: 'text-purple-700' },
  caprine: { bg: 'bg-teal-50 border-teal-100', bar: 'bg-teal-600', text: 'text-teal-700' },
  porcine: { bg: 'bg-rose-50 border-rose-100', bar: 'bg-rose-600', text: 'text-rose-700' },
  poultry: { bg: 'bg-orange-50 border-orange-100', bar: 'bg-orange-600', text: 'text-orange-700' },
  other: { bg: 'bg-gray-50 border-gray-200', bar: 'bg-gray-600', text: 'text-gray-700' }
};

const actionBadges: Record<string, string> = {
  LOGIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-sky-50 text-sky-700 border-sky-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  ROLE_CHANGE: 'bg-purple-50 text-purple-700 border-purple-200'
};

const Dashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'administrator';

  const [indicators, setIndicators] = useState<AdminIndicators | null>(null);
  const [loading, setLoading] = useState<boolean>(isAdmin);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAdminIndicators = useCallback(async (isRefresh = false) => {
    if (!isAdmin) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await adminService.getIndicators();
      setIndicators(data);
    } catch (err: any) {
      console.error('Error fetching admin indicators:', err);
      setError(err?.response?.data?.message || t('dashboard.errorLoading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, t]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminIndicators();
    }
  }, [isAdmin, loadAdminIndicators]);

  // Si no es administrador, renderizamos el panel general/clínico adaptativo
  if (!isAdmin) {
    const generalStats = [
      {
        name: t('dashboard.totalAnimals'),
        value: '45',
        icon: <Cat size={24} />,
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        path: '/animals'
      },
      {
        name: t('dashboard.owners'),
        value: '12',
        icon: <Users size={24} />,
        colorClass: 'text-sky-700 bg-sky-50 border-sky-100',
        path: '/owners'
      },
      {
        name: t('dashboard.appointmentsToday'),
        value: '8',
        icon: <Activity size={24} />,
        colorClass: 'text-amber-700 bg-amber-50 border-amber-100',
        path: '/appointments'
      },
      {
        name: t('dashboard.alerts'),
        value: '2',
        icon: <Beef size={24} />,
        colorClass: 'text-red-700 bg-red-50 border-red-100',
        path: '/alerts'
      },
    ];

    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-1.5 pb-2 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('dashboard.welcome', { username: user?.username || '' })}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {generalStats.map((stat, idx) => (
            <Link
              key={idx}
              to={stat.path}
              className="card bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 flex items-center justify-between hover:shadow-md hover:border-gray-200 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${stat.colorClass}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{stat.name}</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-emerald-700 transition-colors" />
            </Link>
          ))}
        </div>

        <div className="card bg-white rounded-2xl shadow-xs border border-gray-100 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {t('dashboard.recentActivity')}
          </h2>
          <div className="text-gray-400 text-sm text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Activity size={36} className="text-gray-300 mx-auto mb-2" />
            <p>{t('dashboard.noRecentActivity')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD DE ADMINISTRADOR (HU20 & HU21) ─────────────────────────────────
  const overview = indicators?.overview;
  const usersByRole = indicators?.usersByRole || {};
  const animalsBySpecies = indicators?.animalsBySpecies || {};
  const recentActivities = indicators?.recentActivities || [];

  const totalAnimals = overview?.totalAnimals || 0;
  const activeAnimals = overview?.activeAnimals || 0;
  const totalUsers = overview?.totalUsers || 0;
  const totalOwners = overview?.totalOwners || 0;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Cabecera Principal Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {t('dashboard.adminTitle')}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles size={12} className="text-emerald-600" />
              Admin
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {t('dashboard.adminSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAdminIndicators(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[44px] self-start sm:self-auto disabled:opacity-50"
          title={t('common.refresh')}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Manejo de Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <p className="flex-1 font-medium">{error}</p>
          <button
            onClick={() => loadAdminIndicators()}
            className="text-xs font-bold underline hover:text-red-900 cursor-pointer"
          >
            {t('common.refresh')}
          </button>
        </div>
      )}

      {/* Tarjetas KPI de Resumen Global (HU20 - Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Usuarios Totales */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-sky-700">
              <Users size={22} />
            </div>
            <Link
              to="/register"
              className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 group"
            >
              <span>+ Nuevo</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('dashboard.totalUsers')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-gray-900">
                {loading ? '...' : totalUsers}
              </span>
            </div>
            {/* Roles pills */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                Admin: {usersByRole.administrator ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                Vet: {usersByRole.veterinarian ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                Zoo: {usersByRole.zootechnician ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Animales */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
              <Cat size={22} />
            </div>
            <Link
              to="/animals"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 group"
            >
              <span>Ver todos</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('dashboard.totalAnimals')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-gray-900">
                {loading ? '...' : totalAnimals}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 size={12} />
                {activeAnimals} {t('dashboard.activeAnimals')}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 truncate">
              {Object.keys(animalsBySpecies).length} especies registradas
            </p>
          </div>
        </div>

        {/* KPI 3: Propietarios */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
              <Users size={22} />
            </div>
            <Link
              to="/owners"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 group"
            >
              <span>Ver lista</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('dashboard.owners')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-gray-900">
                {loading ? '...' : totalOwners}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 truncate">
              Titulares de animales urbanos y rurales
            </p>
          </div>
        </div>

        {/* KPI 4: Auditoría y Eventos */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
              <ShieldCheck size={22} />
            </div>
            <Link
              to="/audit"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 group"
            >
              <span>Auditoría</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('dashboard.recentActivity')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-gray-900">
                {loading ? '...' : recentActivities.length}
              </span>
              <span className="text-xs text-gray-400">recientes</span>
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 truncate">
              Trazabilidad en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Distribución por Especie y Registro de Actividades Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (1/3): Distribución por Especie */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Cat size={20} className="text-emerald-700" />
                {t('dashboard.speciesDistribution')}
              </h2>
              <span className="text-xs text-gray-500 font-semibold">{totalAnimals} total</span>
            </div>
            <p className="text-xs text-gray-400">
              Proporción de animales registrados por taxonomía
            </p>
          </div>

          <div className="space-y-4 flex-1 my-2">
            {Object.keys(animalsBySpecies).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                {t('dashboard.noData')}
              </div>
            ) : (
              Object.entries(animalsBySpecies).map(([speciesKey, count]) => {
                const percentage = totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0;
                const styling = speciesColors[speciesKey.toLowerCase()] || speciesColors.other;

                return (
                  <div key={speciesKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold capitalize ${styling.text}`}>
                        {speciesKey}
                      </span>
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <span>{count}</span>
                        <span className="text-gray-400 text-[11px]">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Barra de progreso Tailwind */}
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${styling.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Link
              to="/animals"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 transition-colors"
            >
              <span>{t('dashboard.manageAnimals')}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Columna Derecha (2/3): Actividades Recientes / Feed de Auditoría */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <ShieldCheck size={20} className="text-purple-700" />
                {t('dashboard.recentActivity')}
              </h2>
              <p className="text-xs text-gray-400">
                Últimos 10 eventos críticos ejecutados en el sistema
              </p>
            </div>
            <Link
              to="/audit"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 group"
            >
              <span>{t('dashboard.viewAllActivities')}</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400 text-xs">
              <Activity size={32} className="mx-auto mb-2 text-gray-300" />
              <p>{t('dashboard.noRecentActivity')}</p>
            </div>
          ) : (
            <>
              {/* Vista Móvil: Tarjetas Compactas (< 640px) */}
              <div className="sm:hidden space-y-3">
                {recentActivities.slice(0, 5).map((log) => {
                  const badgeClass = actionBadges[log.action] || 'bg-gray-100 text-gray-700 border-gray-200';
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${badgeClass}`}>
                          {log.action}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          isSuccess ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {log.status}
                        </span>
                      </div>
                      <div className="text-gray-900 font-semibold truncate">
                        {log.userEmail || 'Sistema'}
                        {log.userRole && (
                          <span className="text-[10px] text-gray-500 font-normal ml-1 capitalize">
                            ({log.userRole})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-200/60">
                        <span className="font-medium text-gray-600">Recurso: {log.resource}</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista Escritorio / Tablet: Tabla Responsiva (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Usuario</th>
                      <th className="py-2.5 px-3">Acción</th>
                      <th className="py-2.5 px-3">Recurso</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentActivities.map((log) => {
                      const badgeClass = actionBadges[log.action] || 'bg-gray-100 text-gray-700 border-gray-200';
                      const isSuccess = log.status === 'SUCCESS';

                      return (
                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-gray-900 truncate max-w-[180px]">
                              {log.userEmail || 'Sistema'}
                            </p>
                            <p className="text-[10px] text-gray-400 capitalize">
                              {log.userRole || 'Automático'}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] border ${badgeClass}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-gray-700">
                            {log.resource}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                              isSuccess ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-gray-500 text-[11px]">
                            {new Date(log.createdAt).toLocaleString([], {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Accesos Rápidos Administrativos (HU21 - Optimización táctil y mobile responsive) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          {t('dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/register"
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition-all group min-h-[90px] cursor-pointer"
          >
            <UserPlus size={22} className="text-gray-500 group-hover:text-emerald-700 mb-2 transition-colors" />
            <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-800">{t('dashboard.manageUsers')}</span>
          </Link>

          <Link
            to="/animals/create"
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-800 transition-all group min-h-[90px] cursor-pointer"
          >
            <PlusCircle size={22} className="text-gray-500 group-hover:text-sky-700 mb-2 transition-colors" />
            <span className="text-xs font-bold text-gray-700 group-hover:text-sky-800">Registrar Animal</span>
          </Link>

          <Link
            to="/owners/create"
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-all group min-h-[90px] cursor-pointer"
          >
            <Users size={22} className="text-gray-500 group-hover:text-amber-700 mb-2 transition-colors" />
            <span className="text-xs font-bold text-gray-700 group-hover:text-amber-800">{t('dashboard.manageOwners')}</span>
          </Link>

          <Link
            to="/audit"
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-800 transition-all group min-h-[90px] cursor-pointer"
          >
            <ShieldCheck size={22} className="text-gray-500 group-hover:text-purple-700 mb-2 transition-colors" />
            <span className="text-xs font-bold text-gray-700 group-hover:text-purple-800">{t('dashboard.viewAudit')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
