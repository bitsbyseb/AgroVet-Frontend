import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { animalService, authService } from '../../services/api';
import type { Animal, ReproductionRecord, ReproductionInput } from '../../types';
import {
  ArrowLeft,
  Plus,
  Save,
  X,
  Activity,
  Heart,
  Calendar,
  Calculator,
  AlertCircle,
  Info,
  Baby,
  Dna,
  FileText,
  Sparkles,
  Clock,
  ArrowUpDown,
  Table as TableIcon,
  ListTree,
  CheckCircle2,
} from 'lucide-react';
import { formatDateShort } from '../../utils/l10n';

interface FormState {
  reproductiveStatus: string;
  breedingType: string;
  heatDate: string;
  expectedCalvingDate: string;
  bullId: string;
  semenBatch: string;
  inseminationDetails: string;
  lastCalvingDate: string;
  offspringCount: number;
}

const initialFormData: FormState = {
  reproductiveStatus: 'pregnant',
  breedingType: 'natural',
  heatDate: '',
  expectedCalvingDate: '',
  bullId: '',
  semenBatch: '',
  inseminationDetails: '',
  lastCalvingDate: '',
  offspringCount: 0,
};

const AnimalReproduction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const currentUser = authService.getCurrentUser();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [reproduction, setReproduction] = useState<ReproductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // View state: timeline or table
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialFormData);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // RBAC Access Matrix:
  // - Zootechnician: Full Access (Add & View)
  // - Administrator & Veterinarian: Read-Only (View only)
  // - Others: No access
  const isZootechnician = currentUser?.role === 'zootechnician';
  const canViewReproduction = isZootechnician || currentUser?.role === 'administrator' || currentUser?.role === 'veterinarian';
  const canAddReproduction = isZootechnician;

  useEffect(() => {
    if (!canViewReproduction) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    if (id) fetchData();
  }, [id, canViewReproduction]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const animalData = await animalService.getById(id!);
      setAnimal(animalData);

      try {
        const reproductionData = await animalService.getReproduction(id!);
        setReproduction(reproductionData);
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } }).response?.status === 403) {
          setForbidden(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error fetching reproduction:', err);
      setError(t('reproduction.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const calculateExpectedCalving = (heatDateStr: string): string => {
    if (!heatDateStr) return '';
    const date = new Date(heatDateStr);
    if (isNaN(date.getTime())) return '';
    // Standard cattle gestation is approximately 283 days
    date.setDate(date.getDate() + 283);
    return date.toISOString().split('T')[0];
  };

  const handleHeatDateChange = (newHeatDate: string) => {
    setFormData((prev) => {
      const next = { ...prev, heatDate: newHeatDate };
      // Auto-calculate expected calving date if empty or if previously calculated
      if (newHeatDate && (!prev.expectedCalvingDate || prev.expectedCalvingDate === calculateExpectedCalving(prev.heatDate))) {
        next.expectedCalvingDate = calculateExpectedCalving(newHeatDate);
      }
      return next;
    });

    if (clientErrors.expectedCalvingDate || clientErrors.heatDate) {
      setClientErrors((prev) => {
        const updated = { ...prev };
        delete updated.expectedCalvingDate;
        delete updated.heatDate;
        return updated;
      });
    }
  };

  const handleAutoCalculateClick = () => {
    if (!formData.heatDate) return;
    const calculated = calculateExpectedCalving(formData.heatDate);
    setFormData((prev) => ({ ...prev, expectedCalvingDate: calculated }));
    setClientErrors((prev) => {
      const updated = { ...prev };
      delete updated.expectedCalvingDate;
      return updated;
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (Number(formData.offspringCount) < 0) {
      errors.offspringCount = t('reproduction.validation.offspringNegative');
    }

    if (formData.heatDate && formData.expectedCalvingDate) {
      const heat = new Date(formData.heatDate);
      const calving = new Date(formData.expectedCalvingDate);
      if (!isNaN(heat.getTime()) && !isNaN(calving.getTime()) && calving <= heat) {
        errors.expectedCalvingDate = t('reproduction.validation.calvingBeforeHeat');
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canAddReproduction) return;

    if (!validate()) return;

    const submissionData: ReproductionInput = {
      reproductiveStatus: formData.reproductiveStatus || 'pregnant',
      breedingType: formData.breedingType || 'natural',
      offspringCount: Number(formData.offspringCount) || 0,
      heatDate: formData.heatDate ? new Date(formData.heatDate).toISOString() : undefined,
      expectedCalvingDate: formData.expectedCalvingDate ? new Date(formData.expectedCalvingDate).toISOString() : undefined,
      lastCalvingDate: formData.lastCalvingDate ? new Date(formData.lastCalvingDate).toISOString() : undefined,
      bullId: formData.bullId.trim() || undefined,
      semenBatch: formData.semenBatch.trim() || undefined,
      inseminationDetails: formData.inseminationDetails.trim() || undefined,
    };

    setSaving(true);
    setError(null);
    try {
      await animalService.addReproduction(id, submissionData);
      setShowAddForm(false);
      setFormData(initialFormData);
      setClientErrors({});
      fetchData();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          t('reproduction.errors.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  // Helper to extract the primary event date for sorting
  const getEventTime = (r: ReproductionRecord): number => {
    const raw = r.heatDate || r.lastCalvingDate || r.createdAt || '';
    const time = new Date(raw).getTime();
    return isNaN(time) ? 0 : time;
  };

  // Chronologically sorted records based on user selection
  const sortedRecords = useMemo(() => {
    return [...reproduction].sort((a, b) => {
      const timeA = getEventTime(a);
      const timeB = getEventTime(b);
      return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [reproduction, sortDirection]);

  // Active / Most recent record (always based on most recent date)
  const latestRecord = useMemo(() => {
    if (reproduction.length === 0) return null;
    return [...reproduction].sort((a, b) => getEventTime(b) - getEventTime(a))[0];
  }, [reproduction]);

  // Days remaining calculation for calving
  const getCalvingDiffDays = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Status color styles helper
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pregnant':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'lactating':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'open':
      case 'empty':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'dry':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'anestrus':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Breeding type badge style helper
  const getBreedingBadgeStyle = (type?: string | null) => {
    switch (type) {
      case 'natural':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'insemination':
      case 'artificial':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'embryo_transfer':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Activity className="animate-spin text-pink-600" size={20} />
        <span>{t('reproduction.loading')}</span>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
        <Heart size={48} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-800">{t('reproduction.forbiddenTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('reproduction.forbiddenMessage')}</p>
        <button
          onClick={() => navigate('/animals')}
          className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white mt-5 inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          {t('reproduction.backToAnimals')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/animals')}
          className="btn bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Heart className="text-pink-600" size={28} />
            <span>
              {t('reproduction.titleWithName', { name: animal?.name })}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {t(`animals.gender.${animal?.gender}`, { defaultValue: animal?.gender })}
          </p>
        </div>

        {canAddReproduction && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary bg-pink-600 hover:bg-pink-700 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>{t('reproduction.newEvent')}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Reproductive Status Hero Banner */}
      {latestRecord && (
        <div className="card bg-gradient-to-r from-pink-50/70 via-rose-50/40 to-white rounded-xl border border-pink-200 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 bg-pink-600 text-white rounded-xl shadow-xs shrink-0">
                <Heart size={24} />
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-pink-900/70 tracking-wider">
                  {t('reproduction.timeline.activeStatus')}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className={`text-sm px-3 py-0.5 rounded-full font-bold border ${getStatusBadgeStyle(
                      latestRecord.reproductiveStatus
                    )}`}
                  >
                    {t(`reproduction.status.${latestRecord.reproductiveStatus}`, {
                      defaultValue: latestRecord.reproductiveStatus,
                    })}
                  </span>
                  {latestRecord.breedingType && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getBreedingBadgeStyle(
                        latestRecord.breedingType
                      )}`}
                    >
                      {t(`reproduction.breedingType.${latestRecord.breedingType}`, {
                        defaultValue: latestRecord.breedingType,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expected Calving Highlight */}
            {latestRecord.expectedCalvingDate && (
              <div className="bg-white/90 border border-pink-200 rounded-lg p-3 sm:px-4 py-2.5 shadow-xs flex items-center gap-3 shrink-0">
                <div className="p-2 bg-pink-100 text-pink-700 rounded-lg">
                  <Baby size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {t('reproduction.timeline.pendingCalving')}
                  </p>
                  <p className="text-sm font-bold text-pink-700">
                    {formatDateShort(latestRecord.expectedCalvingDate, lang)}
                  </p>
                  {(() => {
                    const days = getCalvingDiffDays(latestRecord.expectedCalvingDate);
                    if (days === null) return null;
                    return (
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                        {days > 0
                          ? t('reproduction.timeline.daysRemaining', { days })
                          : t('reproduction.timeline.overdue')}
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Reproductive Event Form */}
      {showAddForm && (
        <div className="card bg-white rounded-xl shadow-md border border-pink-200 p-6">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                <Heart size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t('reproduction.addEvent')}</h2>
                <p className="text-xs text-gray-500">{t('reproduction.fields.calculateNotice')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center cursor-pointer"
              aria-label={t('common.cancel')}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Estado y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado Reproductivo */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('reproduction.fields.reproductiveStatus')} <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-control w-full text-sm"
                  value={formData.reproductiveStatus}
                  onChange={(e) => setFormData({ ...formData, reproductiveStatus: e.target.value })}
                  required
                >
                  <option value="pregnant">{t('reproduction.status.pregnant')}</option>
                  <option value="open">{t('reproduction.status.open')}</option>
                  <option value="lactating">{t('reproduction.status.lactating')}</option>
                  <option value="dry">{t('reproduction.status.dry')}</option>
                  <option value="anestrus">{t('reproduction.status.anestrus')}</option>
                  <option value="empty">{t('reproduction.status.empty')}</option>
                </select>
              </div>

              {/* Tipo de Reproducción */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('reproduction.fields.breedingType')} <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-control w-full text-sm"
                  value={formData.breedingType}
                  onChange={(e) => setFormData({ ...formData, breedingType: e.target.value })}
                  required
                >
                  <option value="natural">{t('reproduction.breedingType.natural')}</option>
                  <option value="insemination">{t('reproduction.breedingType.insemination')}</option>
                  <option value="artificial">{t('reproduction.breedingType.artificial')}</option>
                  <option value="embryo_transfer">{t('reproduction.breedingType.embryo_transfer')}</option>
                </select>
              </div>
            </div>

            {/* Section 2: Fechas clave (Celo y Parto Probable) */}
            <div className="p-4 bg-pink-50/50 rounded-xl border border-pink-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-pink-800 text-sm font-semibold">
                  <Calendar size={18} className="text-pink-600" />
                  <span>{t('reproduction.fields.heatDate')} & {t('reproduction.fields.expectedCalvingDate')}</span>
                </div>
                {formData.heatDate && (
                  <button
                    type="button"
                    onClick={handleAutoCalculateClick}
                    className="text-xs text-pink-700 bg-pink-100/70 hover:bg-pink-200/70 px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Calculator size={13} />
                    <span>{t('reproduction.fields.autoCalculate')}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha de Celo / Inseminación */}
                <div className="form-group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('reproduction.fields.heatDate')}
                  </label>
                  <input
                    type="date"
                    className="form-control w-full text-sm bg-white"
                    value={formData.heatDate}
                    onChange={(e) => handleHeatDateChange(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    {t('reproduction.fields.calculateNotice')}
                  </p>
                </div>

                {/* Fecha Probable de Parto */}
                <div className="form-group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>{t('reproduction.fields.expectedCalvingDate')}</span>
                    {formData.expectedCalvingDate && (
                      <span className="text-[11px] text-pink-600 font-normal flex items-center gap-1">
                        <Sparkles size={11} />
                        ~283d
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    className={`form-control w-full text-sm bg-white ${
                      clientErrors.expectedCalvingDate ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    value={formData.expectedCalvingDate}
                    onChange={(e) => {
                      setFormData({ ...formData, expectedCalvingDate: e.target.value });
                      if (clientErrors.expectedCalvingDate) {
                        setClientErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.expectedCalvingDate;
                          return updated;
                        });
                      }
                    }}
                  />
                  {clientErrors.expectedCalvingDate && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {clientErrors.expectedCalvingDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Datos de Inseminación / Monta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toro / Reproductor */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Dna size={15} className="text-gray-500" />
                  <span>{t('reproduction.fields.bullId')}</span>
                </label>
                <input
                  type="text"
                  className="form-control w-full text-sm"
                  placeholder={t('reproduction.fields.bullIdPlaceholder')}
                  value={formData.bullId}
                  onChange={(e) => setFormData({ ...formData, bullId: e.target.value })}
                />
              </div>

              {/* Lote de Semen */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Info size={15} className="text-gray-500" />
                  <span>{t('reproduction.fields.semenBatch')}</span>
                </label>
                <input
                  type="text"
                  className="form-control w-full text-sm"
                  placeholder={t('reproduction.fields.semenBatchPlaceholder')}
                  value={formData.semenBatch}
                  onChange={(e) => setFormData({ ...formData, semenBatch: e.target.value })}
                />
              </div>
            </div>

            {/* Detalles de Inseminación / Observaciones */}
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={15} className="text-gray-500" />
                <span>{t('reproduction.fields.inseminationDetails')}</span>
              </label>
              <textarea
                rows={2}
                className="form-control w-full text-sm"
                placeholder={t('reproduction.fields.inseminationDetailsPlaceholder')}
                value={formData.inseminationDetails}
                onChange={(e) => setFormData({ ...formData, inseminationDetails: e.target.value })}
              />
            </div>

            {/* Section 4: Parto previo y Crías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              {/* Fecha Último Parto */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('reproduction.fields.lastCalvingDate')}
                </label>
                <input
                  type="date"
                  className="form-control w-full text-sm"
                  value={formData.lastCalvingDate}
                  onChange={(e) => setFormData({ ...formData, lastCalvingDate: e.target.value })}
                />
              </div>

              {/* Número de Crías */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Baby size={15} className="text-gray-500" />
                  <span>{t('reproduction.fields.offspringCount')}</span> <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`form-control w-full text-sm ${
                    clientErrors.offspringCount ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  value={formData.offspringCount}
                  onChange={(e) => {
                    setFormData({ ...formData, offspringCount: Number(e.target.value) });
                    if (clientErrors.offspringCount) {
                      setClientErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.offspringCount;
                        return updated;
                      });
                    }
                  }}
                  required
                />
                {clientErrors.offspringCount && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {clientErrors.offspringCount}
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 transition inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <X size={18} />
                <span>{t('common.cancel')}</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary bg-pink-600 hover:bg-pink-700 text-white transition inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                disabled={saving}
              >
                <Save size={18} />
                <span>{saving ? t('common.saving') : t('reproduction.saveEvent')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reproductive History Controls: View Mode & Sort Ordering */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-pink-600" />
            <span>{t('reproduction.timeline.title')}</span>
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            {reproduction.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          {/* Sort direction toggle */}
          <button
            onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="btn bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title={sortDirection === 'desc' ? t('reproduction.timeline.sortDesc') : t('reproduction.timeline.sortAsc')}
          >
            <ArrowUpDown size={14} className="text-gray-500" />
            <span>
              {sortDirection === 'desc'
                ? t('reproduction.timeline.sortDesc')
                : t('reproduction.timeline.sortAsc')}
            </span>
          </button>

          {/* View switcher: Timeline vs Table */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListTree size={14} className="text-pink-600" />
              <span>{t('reproduction.timeline.viewTimeline')}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TableIcon size={14} className="text-gray-600" />
              <span>{t('reproduction.timeline.viewTable')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Timeline View or Table View */}
      {sortedRecords.length === 0 ? (
        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
          <Activity size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">{t('reproduction.noRecords')}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('reproduction.noRecordsSubtitle')}</p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-pink-100">
          {sortedRecords.map((record) => {
            const calvingDiff = getCalvingDiffDays(record.expectedCalvingDate);
            return (
              <div key={record.id} className="relative group">
                {/* Timeline Node Marker */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 transform -translate-x-1/2 flex items-center justify-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center shadow-xs transition group-hover:scale-110 ${
                      record.reproductiveStatus === 'pregnant'
                        ? 'border-pink-500 text-pink-600'
                        : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {record.reproductiveStatus === 'pregnant' ? (
                      <Heart size={12} className="fill-pink-500 text-pink-500" />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                  </div>
                </div>

                {/* Event Card */}
                <div className="card bg-white rounded-xl shadow-xs hover:shadow-sm border border-gray-100 p-5 transition space-y-3">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadgeStyle(
                          record.reproductiveStatus
                        )}`}
                      >
                        {t(`reproduction.status.${record.reproductiveStatus}`, {
                          defaultValue: record.reproductiveStatus,
                        })}
                      </span>

                      {record.breedingType && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getBreedingBadgeStyle(
                            record.breedingType
                          )}`}
                        >
                          {t(`reproduction.breedingType.${record.breedingType}`, {
                            defaultValue: record.breedingType,
                          })}
                        </span>
                      )}
                    </div>

                    {/* Primary Date */}
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                      <Calendar size={13} className="text-gray-400" />
                      <span>
                        {record.heatDate
                          ? `${t('reproduction.display.heatDate')}: ${formatDateShort(record.heatDate, lang)}`
                          : record.lastCalvingDate
                          ? `${t('reproduction.display.lastCalving')}: ${formatDateShort(record.lastCalvingDate, lang)}`
                          : record.createdAt
                          ? formatDateShort(record.createdAt, lang)
                          : ''}
                      </span>
                    </div>
                  </div>

                  {/* Expected Calving Highlight Banner (if pregnant / date provided) */}
                  {record.expectedCalvingDate && (
                    <div className="bg-pink-50/70 border border-pink-200/80 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-pink-100 text-pink-700 rounded-md">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-pink-800">
                            {t('reproduction.display.expectedCalving')}
                          </p>
                          <p className="text-sm font-bold text-pink-900">
                            {formatDateShort(record.expectedCalvingDate, lang)}
                          </p>
                        </div>
                      </div>

                      {calvingDiff !== null && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            calvingDiff > 0
                              ? 'bg-white text-pink-700 border-pink-200 shadow-2xs'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {calvingDiff > 0
                            ? t('reproduction.timeline.daysRemaining', { days: calvingDiff })
                            : t('reproduction.timeline.overdue')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata Chips: Toro, Lote, Crías, Último Parto */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {record.bullId && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                        <Dna size={13} className="text-gray-500" />
                        <span className="font-semibold">{t('reproduction.display.bull')}:</span>
                        <span>{record.bullId}</span>
                      </span>
                    )}

                    {record.semenBatch && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                        <Info size={13} className="text-gray-500" />
                        <span className="font-semibold">{t('reproduction.display.batch')}:</span>
                        <span>{record.semenBatch}</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                      <Baby size={13} className="text-gray-500" />
                      <span className="font-semibold">{t('reproduction.display.offspring')}:</span>
                      <span>{record.offspringCount}</span>
                    </span>

                    {record.lastCalvingDate && !record.heatDate && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                        <Clock size={13} className="text-gray-500" />
                        <span className="font-semibold">{t('reproduction.display.lastCalving')}:</span>
                        <span>{formatDateShort(record.lastCalvingDate, lang)}</span>
                      </span>
                    )}
                  </div>

                  {/* Insemination details / notes */}
                  {record.inseminationDetails && (
                    <div className="text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex items-start gap-2">
                      <FileText size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-700">{t('reproduction.display.details')}: </span>
                        <span>{record.inseminationDetails}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STRUCTURED TABLE VIEW */
        <div className="card bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 border-collapse">
              <thead className="bg-gray-50/80 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-4 py-3">{t('reproduction.table.date')}</th>
                  <th scope="col" className="px-4 py-3">{t('reproduction.table.status')}</th>
                  <th scope="col" className="px-4 py-3">{t('reproduction.table.type')}</th>
                  <th scope="col" className="px-4 py-3">{t('reproduction.table.calvingExpected')}</th>
                  <th scope="col" className="px-4 py-3">{t('reproduction.table.bullSemen')}</th>
                  <th scope="col" className="px-4 py-3 text-center">{t('reproduction.table.offspring')}</th>
                  <th scope="col" className="px-4 py-3">{t('reproduction.table.notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRecords.map((record) => {
                  const calvingDiff = getCalvingDiffDays(record.expectedCalvingDate);
                  return (
                    <tr key={record.id} className="hover:bg-pink-50/20 transition">
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                        {record.heatDate
                          ? formatDateShort(record.heatDate, lang)
                          : record.lastCalvingDate
                          ? formatDateShort(record.lastCalvingDate, lang)
                          : record.createdAt
                          ? formatDateShort(record.createdAt, lang)
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadgeStyle(
                            record.reproductiveStatus
                          )}`}
                        >
                          {t(`reproduction.status.${record.reproductiveStatus}`, {
                            defaultValue: record.reproductiveStatus,
                          })}
                        </span>
                      </td>

                      {/* Breeding Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {record.breedingType ? (
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getBreedingBadgeStyle(
                              record.breedingType
                            )}`}
                          >
                            {t(`reproduction.breedingType.${record.breedingType}`, {
                              defaultValue: record.breedingType,
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Expected Calving Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {record.expectedCalvingDate ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-pink-700 inline-flex items-center gap-1">
                              <Sparkles size={12} />
                              {formatDateShort(record.expectedCalvingDate, lang)}
                            </span>
                            {calvingDiff !== null && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                {calvingDiff > 0
                                  ? t('reproduction.timeline.daysRemaining', { days: calvingDiff })
                                  : t('reproduction.timeline.overdue')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Bull / Semen Batch */}
                      <td className="px-4 py-3 text-xs">
                        {record.bullId || record.semenBatch ? (
                          <div className="space-y-0.5">
                            {record.bullId && (
                              <p className="font-semibold text-gray-800">
                                {record.bullId}
                              </p>
                            )}
                            {record.semenBatch && (
                              <p className="text-[11px] text-gray-500">
                                {t('reproduction.display.batch')}: {record.semenBatch}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Offspring Count */}
                      <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-semibold text-gray-800">
                        {record.offspringCount}
                      </td>

                      {/* Notes / Details */}
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={record.inseminationDetails || ''}>
                        {record.inseminationDetails || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalReproduction;
