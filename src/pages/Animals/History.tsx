import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { animalService, authService } from '../../services/api';
import type {
  Animal,
  MedicalHistoryRecord,
  MedicalHistoryInput,
  PhysiologicalConstants,
  VaccineRecord,
  ProductionRecord,
  ReproductionRecord,
} from '../../types';
import {
  ArrowLeft,
  Plus,
  Stethoscope,
  Save,
  X,
  Calendar,
  User as UserIcon,
  FileText,
  Activity,
  Thermometer,
  Scale,
  Clock,
  HeartPulse,
  Wind,
  Eye,
  Pencil,
  AlertCircle,
  Syringe,
  BarChart2,
  Baby,
  ChevronRight,
} from 'lucide-react';
import {
  formatDateLong,
  formatDateShort,
  formatWeight,
  formatQuantity,
  formatTemperature,
  formatNumber,
} from '../../utils/l10n';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'historial' | 'vacunas' | 'produccion' | 'reproduccion';

interface FormState {
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  observations: string;
  evolution: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  capillaryRefillTime: string;
  mucosalState: string;
  weight: string;
  bodyConditionScore: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const initialFormState: FormState = {
  date: new Date().toISOString().split('T')[0],
  reason: '',
  diagnosis: '',
  treatment: '',
  observations: '',
  evolution: '',
  heartRate: '',
  respiratoryRate: '',
  temperature: '',
  capillaryRefillTime: '',
  mucosalState: '',
  weight: '',
  bodyConditionScore: '',
};

const MUCOSAL_KEYS = [
  'rosadas',
  'palidas',
  'cianoticas',
  'ictericas',
  'congestivas',
] as const;

// ─── Helper components ────────────────────────────────────────────────────────

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon, title, subtitle,
}) => (
  <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
    <div className="text-gray-300 mx-auto mb-3 flex justify-center">{icon}</div>
    <h3 className="text-base font-semibold text-gray-700">{title}</h3>
    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
  </div>
);

const TabLoadingState: React.FC<{ label: string }> = ({ label }) => (
  <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
    <Activity className="animate-spin text-emerald-600" size={20} />
    <span>{label}</span>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AnimalHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentUser = authService.getCurrentUser();
  const lang = i18n.language;

  // Animal & core data
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [history, setHistory] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalHistoryRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('historial');

  // Supplementary data
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [reproduction, setReproduction] = useState<ReproductionRecord[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const [fetchedTabs, setFetchedTabs] = useState<Set<ActiveTab>>(new Set(['historial']));

  // RBAC
  const canAddHistory = currentUser?.role === 'veterinarian';

  // ─── Tab config (labels driven by i18n) ──────────────────────────────────

  const TABS: { id: ActiveTab; icon: React.ReactNode }[] = [
    { id: 'historial',    icon: <Stethoscope size={16} /> },
    { id: 'vacunas',      icon: <Syringe size={16} /> },
    { id: 'produccion',   icon: <BarChart2 size={16} /> },
    { id: 'reproduccion', icon: <Baby size={16} /> },
  ];

  // ─── Data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [animalData, historyData] = await Promise.all([
        animalService.getById(id!),
        animalService.getHistory(id!),
      ]);
      setAnimal(animalData);
      setHistory(historyData);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(t('history.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Lazy-load supplementary tab data on demand
  const fetchTabData = async (tab: ActiveTab) => {
    if (fetchedTabs.has(tab) || !id) return;

    setTabLoading(true);
    setTabError(null);

    try {
      if (tab === 'vacunas') {
        const data = await animalService.getVaccines(id);
        setVaccines(data);
      } else if (tab === 'produccion') {
        const data = await animalService.getProduction(id);
        setProduction(data);
      } else if (tab === 'reproduccion') {
        const data = await animalService.getReproduction(id);
        setReproduction(data);
      }
      setFetchedTabs((prev) => new Set([...prev, tab]));
    } catch (err) {
      console.error(`Error fetching ${tab}:`, err);
      setTabError(t('history.errors.tabLoadFailed', { tab: t(`history.tabs.${tab}`) }));
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  // ─── Form handlers ────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData({ ...initialFormState, date: new Date().toISOString().split('T')[0] });
    setClientErrors({});
    setShowAddForm(true);
  };

  const handleOpenEdit = (record: MedicalHistoryRecord) => {
    setEditingRecord(record);
    const dateFormatted = record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0];

    const heartRate = record.heartRate ?? record.physiologicalConstants?.heartRate;
    const respiratoryRate = record.respiratoryRate ?? record.physiologicalConstants?.respiratoryRate;
    const temperature = record.temperature ?? record.physiologicalConstants?.temperature;
    const capillaryRefillTime = record.capillaryRefillTime ?? record.physiologicalConstants?.capillaryRefillTime;
    const mucosalState = record.mucosalState ?? record.physiologicalConstants?.mucosalState;

    setFormData({
      date: dateFormatted,
      reason: record.reason || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      observations: record.observations || '',
      evolution: record.evolution || '',
      heartRate: heartRate != null ? String(heartRate) : '',
      respiratoryRate: respiratoryRate != null ? String(respiratoryRate) : '',
      temperature: temperature != null ? String(temperature) : '',
      capillaryRefillTime: capillaryRefillTime != null ? String(capillaryRefillTime) : '',
      mucosalState: mucosalState || '',
      weight: record.weight != null ? String(record.weight) : '',
      bodyConditionScore: record.bodyConditionScore != null ? String(record.bodyConditionScore) : '',
    });
    setClientErrors({});
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingRecord(null);
    setFormData(initialFormState);
    setClientErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.date) errors.date = t('history.validation.dateRequired');

    if (!formData.reason.trim()) {
      errors.reason = t('history.validation.reasonRequired');
    } else if (formData.reason.trim().length < 3) {
      errors.reason = t('history.validation.reasonMinLength');
    }

    if (!formData.diagnosis.trim()) {
      errors.diagnosis = t('history.validation.diagnosisRequired');
    } else if (formData.diagnosis.trim().length < 3) {
      errors.diagnosis = t('history.validation.diagnosisMinLength');
    }

    if (!formData.treatment.trim()) {
      errors.treatment = t('history.validation.treatmentRequired');
    } else if (formData.treatment.trim().length < 3) {
      errors.treatment = t('history.validation.treatmentMinLength');
    }

    if (formData.weight) {
      const w = parseFloat(formData.weight);
      if (isNaN(w) || w <= 0) errors.weight = t('history.validation.weightPositive');
      else if (w > 3000) errors.weight = t('history.validation.weightMax');
    }

    if (formData.bodyConditionScore) {
      const bcs = parseFloat(formData.bodyConditionScore);
      if (isNaN(bcs) || bcs < 1 || bcs > 9) errors.bodyConditionScore = t('history.validation.bcsRange');
    }

    if (formData.heartRate) {
      const hr = parseInt(formData.heartRate, 10);
      if (isNaN(hr) || hr <= 0 || hr > 500) errors.heartRate = t('history.validation.heartRateRange');
    }

    if (formData.respiratoryRate) {
      const rr = parseInt(formData.respiratoryRate, 10);
      if (isNaN(rr) || rr <= 0 || rr > 200) errors.respiratoryRate = t('history.validation.respiratoryRateRange');
    }

    if (formData.temperature) {
      const temp = parseFloat(formData.temperature);
      if (isNaN(temp) || temp < 25 || temp > 45) errors.temperature = t('history.validation.temperatureRange');
    }

    if (formData.capillaryRefillTime) {
      const trc = parseFloat(formData.capillaryRefillTime);
      if (isNaN(trc) || trc < 0 || trc > 20) errors.capillaryRefillTime = t('history.validation.capillaryRefillRange');
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const physiologicalConstants: PhysiologicalConstants = {};
      if (formData.heartRate) physiologicalConstants.heartRate = Number(formData.heartRate);
      if (formData.respiratoryRate) physiologicalConstants.respiratoryRate = Number(formData.respiratoryRate);
      if (formData.temperature) physiologicalConstants.temperature = Number(formData.temperature);
      if (formData.capillaryRefillTime) physiologicalConstants.capillaryRefillTime = Number(formData.capillaryRefillTime);
      if (formData.mucosalState) physiologicalConstants.mucosalState = formData.mucosalState;

      const hasConstants = Object.keys(physiologicalConstants).length > 0;

      const submissionData: MedicalHistoryInput = {
        date: new Date(formData.date).toISOString(),
        reason: formData.reason.trim(),
        diagnosis: formData.diagnosis.trim(),
        treatment: formData.treatment.trim(),
        observations: formData.observations.trim() || null,
        evolution: formData.evolution.trim() || null,
        physiologicalConstants: hasConstants ? physiologicalConstants : null,
        heartRate: formData.heartRate ? Number(formData.heartRate) : null,
        respiratoryRate: formData.respiratoryRate ? Number(formData.respiratoryRate) : null,
        temperature: formData.temperature ? Number(formData.temperature) : null,
        capillaryRefillTime: formData.capillaryRefillTime ? Number(formData.capillaryRefillTime) : null,
        mucosalState: formData.mucosalState || null,
        weight: formData.weight ? Number(formData.weight) : null,
        bodyConditionScore: formData.bodyConditionScore ? Number(formData.bodyConditionScore) : null,
      };

      if (editingRecord) {
        await animalService.updateHistory(id, editingRecord.id, submissionData);
      } else {
        await animalService.addHistory(id, submissionData);
      }

      handleCloseForm();
      await fetchData();
    } catch (err: unknown) {
      console.error('Error al guardar registro médico:', err);
      const apiErr = err as { response?: { data?: { error?: string; message?: string } } };
      setError(apiErr.response?.data?.error || apiErr.response?.data?.message || t('history.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ─── BCS label helper ─────────────────────────────────────────────────────

  const getBcsLabel = (score: number): string => {
    if (score <= 2) return t('history.vitals.bcs.thin');
    if (score <= 5) return t('history.vitals.bcs.ideal');
    if (score <= 7) return t('history.vitals.bcs.overweight');
    return t('history.vitals.bcs.obese');
  };

  // ─── Loading / Error state ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Activity className="animate-spin text-emerald-600" size={20} />
        <span>{t('history.loading')}</span>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/animals')}
          className="btn bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="text-emerald-700" size={28} />
            <span>
              {t('history.titleWithName', { name: animal?.name })}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {t(`animals.gender.${animal?.gender}`)}
          </p>
        </div>

        {/* New record button only for veterinarian */}
        {canAddHistory && !showAddForm && activeTab === 'historial' && (
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>{t('history.newRecord')}</span>
          </button>
        )}
      </div>

      {/* Global error banner */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Tab navigation ─────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto -mb-px" aria-label={t('history.title')}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={[
                'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer',
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab.icon}
              {t(`history.tabs.${tab.id}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Historial Médico ─────────────────────────────────────────────── */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {/* Clinical form */}
          {showAddForm && (
            <div className="card bg-white rounded-xl shadow-md border border-emerald-200 p-6">
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Stethoscope size={20} className="text-emerald-700" />
                  <span>{editingRecord ? t('history.editRecord') : t('history.addRecord')}</span>
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Section 1: General */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('history.fields.date')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control w-full text-sm ${clientErrors.date ? 'border-red-500 focus:outline-red-500' : ''}`}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                    {clientErrors.date && <p className="text-xs text-red-600 mt-1">{clientErrors.date}</p>}
                  </div>

                  <div className="form-group mb-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('history.fields.reason')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control w-full text-sm ${clientErrors.reason ? 'border-red-500 focus:outline-red-500' : ''}`}
                      placeholder={t('history.fields.reasonPlaceholder')}
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      required
                    />
                    {clientErrors.reason && <p className="text-xs text-red-600 mt-1">{clientErrors.reason}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('history.fields.diagnosis')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`form-control w-full text-sm ${clientErrors.diagnosis ? 'border-red-500 focus:outline-red-500' : ''}`}
                      rows={2}
                      placeholder={t('history.fields.diagnosisPlaceholder')}
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      required
                    />
                    {clientErrors.diagnosis && <p className="text-xs text-red-600 mt-1">{clientErrors.diagnosis}</p>}
                  </div>

                  <div className="form-group mb-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('history.fields.treatment')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`form-control w-full text-sm ${clientErrors.treatment ? 'border-red-500 focus:outline-red-500' : ''}`}
                      rows={2}
                      placeholder={t('history.fields.treatmentPlaceholder')}
                      value={formData.treatment}
                      onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                      required
                    />
                    {clientErrors.treatment && <p className="text-xs text-red-600 mt-1">{clientErrors.treatment}</p>}
                  </div>
                </div>

                {/* Section 2: Evolution */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <label className="block text-sm font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                    <Activity size={16} className="text-emerald-700" />
                    <span>{t('history.evolution.label')}</span>
                  </label>
                  <p className="text-xs text-emerald-700 mb-2">
                    {t('history.evolution.description')}
                  </p>
                  <textarea
                    className="form-control w-full text-sm bg-white"
                    rows={2}
                    placeholder={t('history.evolution.placeholder')}
                    value={formData.evolution}
                    onChange={(e) => setFormData({ ...formData, evolution: e.target.value })}
                  />
                </div>

                {/* Section 3: Physiological constants */}
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                    <HeartPulse size={16} className="text-rose-600" />
                    <span>{t('history.vitals.title')}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="form-group mb-0">
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <HeartPulse size={13} className="text-rose-500" />
                        <span>{t('history.vitals.heartRate')}</span>
                      </label>
                      <input
                        type="number" min="1" max="500"
                        className={`form-control text-sm bg-white ${clientErrors.heartRate ? 'border-red-500' : ''}`}
                        placeholder="Ej: 80"
                        value={formData.heartRate}
                        onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                      />
                      {clientErrors.heartRate && <p className="text-[11px] text-red-600 mt-0.5">{clientErrors.heartRate}</p>}
                    </div>

                    <div className="form-group mb-0">
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Wind size={13} className="text-sky-500" />
                        <span>{t('history.vitals.respiratoryRate')}</span>
                      </label>
                      <input
                        type="number" min="1" max="200"
                        className={`form-control text-sm bg-white ${clientErrors.respiratoryRate ? 'border-red-500' : ''}`}
                        placeholder="Ej: 24"
                        value={formData.respiratoryRate}
                        onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                      />
                      {clientErrors.respiratoryRate && <p className="text-[11px] text-red-600 mt-0.5">{clientErrors.respiratoryRate}</p>}
                    </div>

                    <div className="form-group mb-0">
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Thermometer size={13} className="text-amber-500" />
                        <span>{t('history.vitals.temperature')}</span>
                      </label>
                      <input
                        type="number" step="0.1" min="25" max="45"
                        className={`form-control text-sm bg-white ${clientErrors.temperature ? 'border-red-500' : ''}`}
                        placeholder="Ej: 38.5"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      />
                      {clientErrors.temperature && <p className="text-[11px] text-red-600 mt-0.5">{clientErrors.temperature}</p>}
                    </div>

                    <div className="form-group mb-0">
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Clock size={13} className="text-indigo-500" />
                        <span>{t('history.vitals.capillaryRefillTime')}</span>
                      </label>
                      <input
                        type="number" step="0.5" min="0" max="20"
                        className={`form-control text-sm bg-white ${clientErrors.capillaryRefillTime ? 'border-red-500' : ''}`}
                        placeholder="Ej: 1.5"
                        value={formData.capillaryRefillTime}
                        onChange={(e) => setFormData({ ...formData, capillaryRefillTime: e.target.value })}
                      />
                      {clientErrors.capillaryRefillTime && <p className="text-[11px] text-red-600 mt-0.5">{clientErrors.capillaryRefillTime}</p>}
                    </div>

                    <div className="form-group mb-0">
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Eye size={13} className="text-purple-500" />
                        <span>{t('history.vitals.mucosalState')}</span>
                      </label>
                      <select
                        className="form-control text-sm bg-white"
                        value={formData.mucosalState}
                        onChange={(e) => setFormData({ ...formData, mucosalState: e.target.value })}
                      >
                        <option value="">{t('history.vitals.selectMucosal')}</option>
                        {MUCOSAL_KEYS.map((key) => (
                          <option key={key} value={key}>{t(`history.mucosal.${key}`)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Body measurements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Scale size={16} className="text-emerald-600" />
                      <span>{t('history.vitals.weight')}</span>
                    </label>
                    <input
                      type="number" step="0.1" min="0.1"
                      className={`form-control w-full text-sm ${clientErrors.weight ? 'border-red-500' : ''}`}
                      placeholder="Ej: 24.5"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                    {clientErrors.weight && <p className="text-xs text-red-600 mt-1">{clientErrors.weight}</p>}
                  </div>

                  <div className="form-group mb-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Activity size={16} className="text-blue-600" />
                      <span>{t('history.vitals.bodyConditionScore')}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" step="0.5" min="1" max="9"
                        className={`form-control w-full text-sm ${clientErrors.bodyConditionScore ? 'border-red-500' : ''}`}
                        placeholder={t('history.vitals.bodyConditionPlaceholder')}
                        value={formData.bodyConditionScore}
                        onChange={(e) => setFormData({ ...formData, bodyConditionScore: e.target.value })}
                      />
                      {formData.bodyConditionScore && (
                        <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md whitespace-nowrap">
                          {getBcsLabel(Number(formData.bodyConditionScore))}
                        </span>
                      )}
                    </div>
                    {clientErrors.bodyConditionScore && <p className="text-xs text-red-600 mt-1">{clientErrors.bodyConditionScore}</p>}
                  </div>
                </div>

                {/* Section 5: Observations */}
                <div className="form-group mb-0">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('history.fields.observations')}
                  </label>
                  <textarea
                    className="form-control w-full text-sm"
                    rows={2}
                    placeholder={t('history.fields.observationsPlaceholder')}
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  />
                </div>

                {/* Form actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 transition inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X size={18} />
                    <span>{t('common.cancel')}</span>
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white transition inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    disabled={saving}
                  >
                    <Save size={18} />
                    <span>
                      {saving
                        ? t('common.saving')
                        : editingRecord
                        ? t('history.updateRecord')
                        : t('history.saveRecord')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Medical records list */}
          <div className="space-y-4">
            {history.length === 0 ? (
              <EmptyState
                icon={<FileText size={48} />}
                title={t('history.noRecords')}
                subtitle={t('history.noRecordsSubtitle')}
              />
            ) : (
              history.map((record) => {
                const heartRate = record.heartRate ?? record.physiologicalConstants?.heartRate;
                const respiratoryRate = record.respiratoryRate ?? record.physiologicalConstants?.respiratoryRate;
                const temperature = record.temperature ?? record.physiologicalConstants?.temperature;
                const capillaryRefillTime = record.capillaryRefillTime ?? record.physiologicalConstants?.capillaryRefillTime;
                const mucosalState = record.mucosalState ?? record.physiologicalConstants?.mucosalState;
                const hasConstants =
                  heartRate != null || respiratoryRate != null || temperature != null ||
                  capillaryRefillTime != null || mucosalState != null;
                const hasMeasurements = record.weight != null || record.bodyConditionScore != null;

                return (
                  <div
                    key={record.id}
                    className="card bg-white rounded-xl shadow-xs border-l-4 border-l-emerald-600 border border-gray-100 p-5 space-y-4"
                  >
                    {/* Record header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{record.reason}</h3>
                          <p className="text-xs text-gray-500 capitalize">
                            {formatDateLong(record.date, lang)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {record.professional && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                            <UserIcon size={14} />
                            <span>{record.professional.username} ({record.professional.role})</span>
                          </div>
                        )}
                        {canAddHistory && (
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer"
                            title={t('history.editTooltip')}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Diagnosis & treatment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          {t('history.sections.diagnosis')}
                        </h4>
                        <p className="text-sm text-gray-800">{record.diagnosis}</p>
                      </div>
                      <div className="bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          {t('history.sections.treatment')}
                        </h4>
                        <p className="text-sm text-gray-800">{record.treatment}</p>
                      </div>
                    </div>

                    {/* Evolution */}
                    {record.evolution && (
                      <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
                          <Activity size={14} className="text-emerald-700" />
                          <span>{t('history.evolution.clinical')}</span>
                        </h4>
                        <p className="text-sm text-emerald-950 font-medium leading-relaxed">{record.evolution}</p>
                      </div>
                    )}

                    {/* Vitals & measurements badges */}
                    {(hasConstants || hasMeasurements) && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {record.weight != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                              <Scale size={14} className="text-emerald-600" />
                              <span>
                                {t('history.vitals.weightShort')}:{' '}
                                <strong>{formatWeight(record.weight, lang)}</strong>
                              </span>
                            </div>
                          )}
                          {record.bodyConditionScore != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold">
                              <Activity size={14} className="text-blue-600" />
                              <span>
                                {t('history.vitals.bodyConditionShort')}:{' '}
                                <strong>{record.bodyConditionScore}/9</strong>
                              </span>
                            </div>
                          )}
                          {heartRate != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-medium">
                              <HeartPulse size={14} className="text-rose-600" />
                              <span>
                                {t('history.vitals.heartRate')}:{' '}
                                <strong>{formatNumber(heartRate, lang)} lpm</strong>
                              </span>
                            </div>
                          )}
                          {respiratoryRate != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-medium">
                              <Wind size={14} className="text-sky-600" />
                              <span>
                                {t('history.vitals.respiratoryRate')}:{' '}
                                <strong>{formatNumber(respiratoryRate, lang)} rpm</strong>
                              </span>
                            </div>
                          )}
                          {temperature != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium">
                              <Thermometer size={14} className="text-amber-600" />
                              <span>
                                {t('history.vitals.temperature')}:{' '}
                                <strong>{formatTemperature(temperature, lang)}</strong>
                              </span>
                            </div>
                          )}
                          {capillaryRefillTime != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-medium">
                              <Clock size={14} className="text-indigo-600" />
                              <span>
                                {t('history.vitals.capillaryRefillTime')}:{' '}
                                <strong>{formatNumber(capillaryRefillTime, lang)} s</strong>
                              </span>
                            </div>
                          )}
                          {mucosalState && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-medium capitalize">
                              <Eye size={14} className="text-purple-600" />
                              <span>
                                {t('history.vitals.mucosalState')}:{' '}
                                <strong>{mucosalState}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Observations */}
                    {record.observations && (
                      <div className="pt-2 border-t border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          {t('history.fields.observations_label')}
                        </h4>
                        <p className="text-sm italic text-gray-600">{record.observations}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Vacunas ─────────────────────────────────────────────── */}
      {activeTab === 'vacunas' && (
        <div className="space-y-4">
          {tabLoading ? (
            <TabLoadingState label={t('history.loadingTab')} />
          ) : tabError ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{tabError}</span>
            </div>
          ) : vaccines.length === 0 ? (
            <EmptyState
              icon={<Syringe size={48} />}
              title={t('history.vaccines.noRecords')}
              subtitle={t('history.vaccines.noRecordsSubtitle')}
            />
          ) : (
            <div className="space-y-3">
              {vaccines.map((vax) => (
                <div
                  key={vax.id}
                  className="card bg-white rounded-xl shadow-xs border-l-4 border-l-sky-500 border border-gray-100 p-5"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
                        <Syringe size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{vax.vaccineName}</h3>
                        <p className="text-xs text-gray-500">
                          {t('history.vaccines.applied', {
                            date: formatDateShort(vax.applicationDate, lang),
                          })}
                        </p>
                      </div>
                    </div>
                    {vax.nextDoseDate && (
                      <div className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                        <Calendar size={13} />
                        <span>
                          {t('history.vaccines.nextDose', {
                            date: formatDateShort(vax.nextDoseDate, lang),
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {vax.batchNumber && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {t('history.vaccines.batch')}: <strong>{vax.batchNumber}</strong>
                      </span>
                    )}
                    {vax.administeredBy && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                        <UserIcon size={12} />
                        {vax.administeredBy.username}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Producción ──────────────────────────────────────────── */}
      {activeTab === 'produccion' && (
        <div className="space-y-4">
          {tabLoading ? (
            <TabLoadingState label={t('history.loadingTab')} />
          ) : tabError ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{tabError}</span>
            </div>
          ) : production.length === 0 ? (
            <EmptyState
              icon={<BarChart2 size={48} />}
              title={t('production.noRecords')}
              subtitle={t('production.noRecordsSubtitle')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {production.map((prod) => (
                <div
                  key={prod.id}
                  className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
                      <BarChart2 size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">{prod.type}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateShort(prod.date, lang)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-gray-900">
                      {formatQuantity(prod.quantity, prod.unit, lang)}
                    </span>
                  </div>
                  {prod.purpose && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <ChevronRight size={13} className="text-gray-400" />
                      <span>{t(`production.purpose.${prod.purpose}`, { defaultValue: prod.purpose })}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Reproducción ────────────────────────────────────────── */}
      {activeTab === 'reproduccion' && (
        <div className="space-y-4">
          {tabLoading ? (
            <TabLoadingState label={t('history.loadingTab')} />
          ) : tabError ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{tabError}</span>
            </div>
          ) : reproduction.length === 0 ? (
            <EmptyState
              icon={<Baby size={48} />}
              title={t('reproduction.noRecords')}
              subtitle={t('reproduction.noRecordsSubtitle')}
            />
          ) : (
            <div className="space-y-3">
              {reproduction.map((rep) => (
                <div
                  key={rep.id}
                  className="card bg-white rounded-xl shadow-xs border-l-4 border-l-pink-400 border border-gray-100 p-5"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                        {t('reproduction.display.status')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {t(`reproduction.status.${rep.reproductiveStatus}`, { defaultValue: rep.reproductiveStatus })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                        {t('reproduction.display.offspring')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{rep.offspringCount}</p>
                    </div>
                    {rep.breedingType && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                          {t('reproduction.display.breedingType')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {t(`reproduction.breedingType.${rep.breedingType}`, { defaultValue: rep.breedingType })}
                        </p>
                      </div>
                    )}
                    {rep.heatDate && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                          {t('reproduction.display.heatDate')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateShort(rep.heatDate, lang)}
                        </p>
                      </div>
                    )}
                    {rep.expectedCalvingDate && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-pink-600 mb-0.5">
                          {t('reproduction.display.expectedCalving')}
                        </p>
                        <p className="text-sm font-semibold text-pink-800">
                          {formatDateShort(rep.expectedCalvingDate, lang)}
                        </p>
                      </div>
                    )}
                    {rep.bullId && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                          {t('reproduction.display.bull')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {rep.bullId}
                        </p>
                      </div>
                    )}
                    {rep.lastCalvingDate && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                          {t('reproduction.display.lastCalving')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateShort(rep.lastCalvingDate, lang)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimalHistory;
