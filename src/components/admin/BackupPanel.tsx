import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../services/api';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  ShieldAlert,
  X
} from 'lucide-react';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const BackupPanel: React.FC = () => {
  const { t } = useTranslation();

  // ── Estado del respaldo ──────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<FeedbackState>(null);

  // ── Estado de la restauración ────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<FeedbackState>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers: Respaldo ───────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    setDownloadFeedback(null);
    try {
      await adminService.downloadBackup();
      setDownloadFeedback({ type: 'success', message: t('dashboard.backup.downloadSuccess') });
    } catch {
      setDownloadFeedback({ type: 'error', message: t('dashboard.backup.downloadError') });
    } finally {
      setDownloading(false);
    }
  };

  // ── Handlers: Selección de archivo ──────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setRestoreFeedback(null);
    // Reset el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  const handleRestoreClick = () => {
    if (!selectedFile) return;
    setShowConfirm(true);
  };

  // ── Handlers: Restauración confirmada ───────────────────────────────────
  const handleConfirmRestore = async () => {
    if (!selectedFile) return;
    setShowConfirm(false);
    setRestoring(true);
    setRestoreFeedback(null);
    try {
      const result = await adminService.restoreDatabase(selectedFile);
      setRestoreFeedback({ type: 'success', message: result.message || t('dashboard.backup.restoreSuccess') });
      setSelectedFile(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || t('dashboard.backup.restoreError');
      setRestoreFeedback({ type: 'error', message: msg });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      {/* ─── Modal de Confirmación ─────────────────────────────────────────── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full overflow-hidden">
            {/* Cabecera roja de peligro */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <ShieldAlert size={24} className="text-white" />
              </div>
              <h2 id="confirm-title" className="text-base font-black text-white">
                {t('dashboard.backup.confirmTitle')}
              </h2>
            </div>

            {/* Cuerpo */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {t('dashboard.backup.confirmMessage')}
              </p>

              {selectedFile && (
                <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                  <FileText size={16} className="text-amber-600 shrink-0" />
                  <span className="font-semibold text-amber-900 truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-amber-700 ml-auto font-medium shrink-0">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-red-700 font-semibold">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{t('dashboard.backup.warningDesc')}</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-6 pb-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer min-h-[42px]"
              >
                {t('dashboard.backup.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer min-h-[42px] shadow-sm inline-flex items-center gap-2"
              >
                <ShieldAlert size={15} />
                {t('dashboard.backup.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Panel Principal de Backup ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="p-2.5 bg-slate-800 rounded-xl text-white">
            <Database size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              {t('dashboard.backup.title')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {t('dashboard.backup.subtitle')}
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ─── Tarjeta de Respaldo ───────────────────────────────────────── */}
          <div className="space-y-4 p-5 rounded-xl border border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <Download size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Generar Respaldo</p>
                <p className="text-xs text-gray-500">Exporta todos los datos en un archivo .sql</p>
              </div>
            </div>

            {/* Feedback de descarga */}
            {downloadFeedback && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium border ${
                  downloadFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {downloadFeedback.type === 'success'
                  ? <CheckCircle2 size={14} className="shrink-0" />
                  : <XCircle size={14} className="shrink-0" />
                }
                <span className="flex-1">{downloadFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setDownloadFeedback(null)}
                  className="ml-auto text-current opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {downloading
                ? <><RefreshCw size={16} className="animate-spin" /> {t('dashboard.backup.downloading')}</>
                : <><Download size={16} /> {t('dashboard.backup.downloadBtn')}</>
              }
            </button>
          </div>

          {/* ─── Tarjeta de Restauración ──────────────────────────────────── */}
          <div className="space-y-4 p-5 rounded-xl border border-red-100 bg-red-50/30">
            {/* Etiqueta de zona de riesgo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-100 text-red-700">
                  <Upload size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Restaurar Base de Datos</p>
                  <p className="text-xs text-gray-500">Importa un respaldo SQL existente</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full border border-red-200 tracking-wide">
                <AlertTriangle size={10} />
                {t('dashboard.backup.warningLabel')}
              </span>
            </div>

            {/* Aviso de destrucción de datos */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p>{t('dashboard.backup.warningDesc')}</p>
            </div>

            {/* Feedback de restauración */}
            {restoreFeedback && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium border ${
                  restoreFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {restoreFeedback.type === 'success'
                  ? <CheckCircle2 size={14} className="shrink-0" />
                  : <XCircle size={14} className="shrink-0" />
                }
                <span className="flex-1">{restoreFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setRestoreFeedback(null)}
                  className="ml-auto text-current opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql"
              className="hidden"
              onChange={handleFileChange}
              aria-label={t('dashboard.backup.selectFile')}
            />

            {/* Selector de archivo visible */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FileText size={16} className="text-gray-500" />
              {selectedFile
                ? <span className="truncate max-w-[180px] text-gray-900">{selectedFile.name}</span>
                : <span className="text-gray-500">{t('dashboard.backup.selectFile')}</span>
              }
            </button>

            {/* Botón de restaurar */}
            <button
              type="button"
              onClick={handleRestoreClick}
              disabled={!selectedFile || restoring}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {restoring
                ? <><RefreshCw size={16} className="animate-spin" /> {t('dashboard.backup.restoring')}</>
                : <><Upload size={16} /> {t('dashboard.backup.restoreBtn')}</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BackupPanel;
