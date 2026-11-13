import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { auditService } from '../../services/api';
import type { AuditLog, AuditLogFilters } from '../../types';
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogIn,
  Edit,
  Trash2,
  PlusCircle,
  Eye,
  X
} from 'lucide-react';
import { formatDateLong } from '../../utils/l10n';

const PAGE_SIZE = 20;

export const AuditLogsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Filter state
  const [filters, setFilters] = useState<AuditLogFilters>({
    userId: '',
    action: '',
    resource: '',
    status: '',
    from: '',
    to: '',
    limit: PAGE_SIZE,
    offset: 0
  });

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async (currentFilters: AuditLogFilters) => {
    try {
      setLoading(true);
      setError(null);
      // Clean empty strings
      const cleaned: AuditLogFilters = {};
      if (currentFilters.userId?.trim()) cleaned.userId = currentFilters.userId.trim();
      if (currentFilters.action?.trim()) cleaned.action = currentFilters.action.trim();
      if (currentFilters.resource?.trim()) cleaned.resource = currentFilters.resource.trim();
      if (currentFilters.status?.trim()) cleaned.status = currentFilters.status.trim();
      if (currentFilters.from?.trim()) cleaned.from = currentFilters.from.trim();
      if (currentFilters.to?.trim()) cleaned.to = currentFilters.to.trim();
      cleaned.limit = currentFilters.limit ?? PAGE_SIZE;
      cleaned.offset = currentFilters.offset ?? 0;

      const res = await auditService.getLogs(cleaned);
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err: unknown) {
      console.error('Error fetching audit logs:', err);
      setError(t('production.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLogs(filters);
  }, [fetchLogs, filters]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, offset: 0 }));
  };

  const handleResetFilters = () => {
    const resetState: AuditLogFilters = {
      userId: '',
      action: '',
      resource: '',
      status: '',
      from: '',
      to: '',
      limit: PAGE_SIZE,
      offset: 0
    };
    setFilters(resetState);
  };

  const handlePageChange = (newOffset: number) => {
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  // KPI calculations on the current result set
  const loginCount = logs.filter((l) => l.action === 'LOGIN').length;
  const mutationCount = logs.filter((l) => ['CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE', 'TRANSFER'].includes(l.action)).length;
  const failureCount = logs.filter((l) => l.status === 'FAILURE').length;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <LogIn size={11} />
            {t(`audit.actions.${action}`, { defaultValue: action })}
          </span>
        );
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle size={11} />
            {t(`audit.actions.${action}`, { defaultValue: action })}
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Edit size={11} />
            {t(`audit.actions.${action}`, { defaultValue: action })}
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <Trash2 size={11} />
            {t(`audit.actions.${action}`, { defaultValue: action })}
          </span>
        );
      case 'ROLE_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <User size={11} />
            {t(`audit.actions.${action}`, { defaultValue: action })}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {t(`audit.actions.${action}`, { defaultValue: action })}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={11} />
          SUCCESS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
        <AlertTriangle size={11} />
        FAILURE
      </span>
    );
  };

  const currentPage = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-emerald-700" size={28} />
            <span>{t('audit.title')}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('audit.subtitle')}
          </p>
        </div>
      </div>

      {/* ─── KPI Stats Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('audit.kpi.totalEvents')}
            </p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Activity size={22} />
          </div>
        </div>

        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('audit.kpi.logins')}
            </p>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{loginCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <LogIn size={22} />
          </div>
        </div>

        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('audit.kpi.mutations')}
            </p>
            <p className="text-2xl font-extrabold text-purple-700 mt-1">{mutationCount}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Edit size={22} />
          </div>
        </div>

        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('audit.kpi.failures')}
            </p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{failureCount}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* ─── Filters Form ─────────────────────────────────────────── */}
      <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-5">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Filter size={15} className="text-emerald-700" />
            <span>{t('audit.filters.apply')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {/* Usuario ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t('audit.filters.user')}
              </label>
              <input
                type="text"
                placeholder={t('audit.filters.userPlaceholder')}
                value={filters.userId ?? ''}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="form-control w-full text-xs py-1.5 px-3 rounded-lg border-gray-200"
              />
            </div>

            {/* Acción */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t('audit.filters.action')}
              </label>
              <select
                value={filters.action ?? ''}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="form-control w-full text-xs py-1.5 px-3 rounded-lg border-gray-200"
              >
                <option value="">{t('audit.filters.allActions')}</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="ROLE_CHANGE">ROLE_CHANGE</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>

            {/* Recurso */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t('audit.filters.resource')}
              </label>
              <select
                value={filters.resource ?? ''}
                onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                className="form-control w-full text-xs py-1.5 px-3 rounded-lg border-gray-200"
              >
                <option value="">{t('audit.filters.allResources')}</option>
                <option value="AUTH">AUTH</option>
                <option value="USER">USER</option>
                <option value="ANIMAL">ANIMAL</option>
                <option value="OWNER">OWNER</option>
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="REPRODUCTION">REPRODUCTION</option>
                <option value="MEDICAL_HISTORY">MEDICAL_HISTORY</option>
                <option value="VACCINATION">VACCINATION</option>
                <option value="PADDOCK">PADDOCK</option>
                <option value="GRAZING">GRAZING</option>
                <option value="ALERT">ALERT</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t('audit.filters.status')}
              </label>
              <select
                value={filters.status ?? ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="form-control w-full text-xs py-1.5 px-3 rounded-lg border-gray-200"
              >
                <option value="">{t('audit.filters.allStatuses')}</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </div>

            {/* Fechas: Desde */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t('audit.filters.from')}
              </label>
              <input
                type="date"
                value={filters.from ?? ''}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                className="form-control w-full text-xs py-1.5 px-3 rounded-lg border-gray-200"
              />
            </div>

            {/* Fechas: Hasta */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t('audit.filters.to')}
              </label>
              <input
                type="date"
                value={filters.to ?? ''}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className="form-control w-full text-xs py-1.5 px-3 rounded-lg border-gray-200"
              />
            </div>

            {/* Botones de acción */}
            <div className="sm:col-span-2 flex items-end justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg transition cursor-pointer"
              >
                {t('audit.filters.reset')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 rounded-lg shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>{t('audit.filters.apply')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs text-sm">
          {error}
        </div>
      )}

      {/* ─── Table ─────────────────────────────────────────────────── */}
      <div className="card bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3 px-4">{t('audit.table.timestamp')}</th>
                <th className="py-3 px-4">{t('audit.table.user')}</th>
                <th className="py-3 px-4">{t('audit.table.action')}</th>
                <th className="py-3 px-4">{t('audit.table.resource')}</th>
                <th className="py-3 px-4">{t('audit.table.status')}</th>
                <th className="py-3 px-4">{t('audit.table.ip')}</th>
                <th className="py-3 px-4 text-right">{t('audit.table.details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-2" size={24} />
                    <span>{t('common.loading')}</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <ShieldCheck size={48} className="text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-700">
                      {t('audit.table.noLogs')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('audit.table.noLogsSubtitle')}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        <span>{formatDateLong(log.createdAt, lang)}</span>
                        <span className="text-gray-400 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div>
                        <span className="font-semibold text-gray-800 block">
                          {log.userEmail || (log.userId ? log.userId.slice(0, 8) + '...' : 'Anónimo')}
                        </span>
                        {log.userRole && (
                          <span className="text-[11px] text-gray-400 capitalize">
                            {t(`roles.${log.userRole}`, { defaultValue: log.userRole })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-gray-700">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {log.resource}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-gray-500">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.details ? (
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="btn text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2.5 rounded-md transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>{t('audit.table.details')}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ────────────────────────────────────── */}
        {total > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <span>
              Mostrando {logs.length} de {total} eventos (Página {currentPage} de {totalPages})
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => handlePageChange(Math.max((filters.offset ?? 0) - PAGE_SIZE, 0))}
                className="btn bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg transition disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => handlePageChange((filters.offset ?? 0) + PAGE_SIZE)}
                className="btn bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg transition disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Details Modal ─────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="card bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-700" />
                <span>Detalle de Evento</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 uppercase font-semibold">ID:</span>
                <span className="font-mono text-gray-700">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 uppercase font-semibold">Usuario:</span>
                <span className="font-semibold text-gray-900">{selectedLog.userEmail || selectedLog.userId || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 uppercase font-semibold">Acción / Recurso:</span>
                <span className="font-semibold text-gray-900">{selectedLog.action} / {selectedLog.resource}</span>
              </div>
              {selectedLog.resourceId && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 uppercase font-semibold">Resource ID:</span>
                  <span className="font-mono text-gray-700">{selectedLog.resourceId}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 uppercase font-semibold">IP Address:</span>
                <span className="font-mono text-gray-700">{selectedLog.ipAddress || '—'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Carga / Detalles
              </label>
              <pre className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2);
                  } catch {
                    return selectedLog.details;
                  }
                })()}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 rounded-lg transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsView;
