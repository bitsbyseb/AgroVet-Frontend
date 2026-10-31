import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
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

const MUCOSAL_OPTIONS = [
  { value: 'rosadas', label: 'Rosadas (Normal)' },
  { value: 'palidas', label: 'Pálidas (Anemia / Hipovolemia)' },
  { value: 'cianoticas', label: 'Cianóticas (Hipoxia)' },
  { value: 'ictericas', label: 'Ictéricas (Hepatopatía / Hemólisis)' },
  { value: 'congestivas', label: 'Congestivas / Hiperémicas (Fiebre / Sepsis)' },
];

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'historial',     label: 'Historial Médico',  icon: <Stethoscope size={16} /> },
  { id: 'vacunas',       label: 'Vacunas',            icon: <Syringe size={16} /> },
  { id: 'produccion',    label: 'Producción',         icon: <BarChart2 size={16} /> },
  { id: 'reproduccion',  label: 'Reproducción',       icon: <Baby size={16} /> },
];

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

const TabLoadingState: React.FC = () => (
  <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
    <Activity className="animate-spin text-emerald-600" size={20} />
    <span>Cargando datos...</span>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AnimalHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

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

  // Supplementary data (HU9T4)
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [reproduction, setReproduction] = useState<ReproductionRecord[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  // Track which tabs have been fetched to avoid duplicate requests
  const [fetchedTabs, setFetchedTabs] = useState<Set<ActiveTab>>(new Set(['historial']));

  // RBAC
  const canAddHistory = currentUser?.role === 'veterinarian';

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
      setError('No se pudo cargar la información del animal o su historial.');
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
      setTabError(`No se pudo cargar la información de ${tab}.`);
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

    if (!formData.date) errors.date = 'La fecha de consulta es obligatoria.';

    if (!formData.reason.trim()) {
      errors.reason = 'El motivo de consulta es obligatorio.';
    } else if (formData.reason.trim().length < 3) {
      errors.reason = 'El motivo debe tener al menos 3 caracteres.';
    }

    if (!formData.diagnosis.trim()) {
      errors.diagnosis = 'El diagnóstico es obligatorio.';
    } else if (formData.diagnosis.trim().length < 3) {
      errors.diagnosis = 'El diagnóstico debe tener al menos 3 caracteres.';
    }

    if (!formData.treatment.trim()) {
      errors.treatment = 'El tratamiento es obligatorio.';
    } else if (formData.treatment.trim().length < 3) {
      errors.treatment = 'El tratamiento debe tener al menos 3 caracteres.';
    }

    if (formData.weight) {
      const w = parseFloat(formData.weight);
      if (isNaN(w) || w <= 0) errors.weight = 'El peso debe ser un número positivo mayor a 0.';
      else if (w > 3000) errors.weight = 'El peso no puede exceder 3000 kg.';
    }

    if (formData.bodyConditionScore) {
      const bcs = parseFloat(formData.bodyConditionScore);
      if (isNaN(bcs) || bcs < 1 || bcs > 9) errors.bodyConditionScore = 'La condición corporal debe estar entre 1 y 9.';
    }

    if (formData.heartRate) {
      const hr = parseInt(formData.heartRate, 10);
      if (isNaN(hr) || hr <= 0 || hr > 500) errors.heartRate = 'La frecuencia cardíaca debe ser un número entero entre 1 y 500 lpm.';
    }

    if (formData.respiratoryRate) {
      const rr = parseInt(formData.respiratoryRate, 10);
      if (isNaN(rr) || rr <= 0 || rr > 200) errors.respiratoryRate = 'La frecuencia respiratoria debe estar entre 1 y 200 rpm.';
    }

    if (formData.temperature) {
      const t = parseFloat(formData.temperature);
      if (isNaN(t) || t < 25 || t > 45) errors.temperature = 'La temperatura debe estar en el rango biológico de 25°C a 45°C.';
    }

    if (formData.capillaryRefillTime) {
      const trc = parseFloat(formData.capillaryRefillTime);
      if (isNaN(trc) || trc < 0 || trc > 20) errors.capillaryRefillTime = 'El tiempo de llenado capilar debe estar entre 0 y 20 segundos.';
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
      setError(apiErr.response?.data?.error || apiErr.response?.data?.message || 'Error al guardar el registro médico.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading / Error state ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Activity className="animate-spin text-emerald-600" size={20} />
        <span>Cargando historial médico...</span>
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
          <span>Regresar</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="text-emerald-700" size={28} />
            <span>
              Historial Clínico: <span className="text-emerald-700">{animal?.name}</span>
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>

        {/* HU9T1 — New record button only for veterinarian */}
        {canAddHistory && !showAddForm && activeTab === 'historial' && (
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Registro</span>
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

      {/* ── Tab navigation (HU9T4) ─────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto -mb-px" aria-label="Secciones del animal">
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Historial Médico ─────────────────────────────────────────────── */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {/* Clinical form (HU8) */}
          {showAddForm && (
            <div className="card bg-white rounded-xl shadow-md border border-emerald-200 p-6">
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Stethoscope size={20} className="text-emerald-700" />
                  <span>{editingRecord ? 'Editar Registro Médico' : 'Agregar Nuevo Registro Médico'}</span>
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
                      Fecha de la Consulta <span className="text-red-500">*</span>
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
                      Motivo de Consulta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control w-full text-sm ${clientErrors.reason ? 'border-red-500 focus:outline-red-500' : ''}`}
                      placeholder="Ej: Control de peso, Herida en pata, Fiebre..."
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
                      Diagnóstico <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`form-control w-full text-sm ${clientErrors.diagnosis ? 'border-red-500 focus:outline-red-500' : ''}`}
                      rows={2}
                      placeholder="Descripción del diagnóstico clínico..."
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      required
                    />
                    {clientErrors.diagnosis && <p className="text-xs text-red-600 mt-1">{clientErrors.diagnosis}</p>}
                  </div>

                  <div className="form-group mb-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Tratamiento <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`form-control w-full text-sm ${clientErrors.treatment ? 'border-red-500 focus:outline-red-500' : ''}`}
                      rows={2}
                      placeholder="Medicamentos, dosis, frecuencia y duración..."
                      value={formData.treatment}
                      onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                      required
                    />
                    {clientErrors.treatment && <p className="text-xs text-red-600 mt-1">{clientErrors.treatment}</p>}
                  </div>
                </div>

                {/* Section 2: Evolution (HU8) */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <label className="block text-sm font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                    <Activity size={16} className="text-emerald-700" />
                    <span>Evolución Médica</span>
                  </label>
                  <p className="text-xs text-emerald-700 mb-2">
                    Registre notas sobre la respuesta al tratamiento, estado clínico progresivo o cambios entre sesiones.
                  </p>
                  <textarea
                    className="form-control w-full text-sm bg-white"
                    rows={2}
                    placeholder="Ej: Paciente responde favorablemente al antibiótico, herida cicatriza sin signos de infección..."
                    value={formData.evolution}
                    onChange={(e) => setFormData({ ...formData, evolution: e.target.value })}
                  />
                </div>

                {/* Section 3: Physiological constants */}
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                    <HeartPulse size={16} className="text-rose-600" />
                    <span>Constantes Fisiológicas</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="form-group mb-0">
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <HeartPulse size={13} className="text-rose-500" />
                        <span>FC (lpm)</span>
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
                        <span>FR (rpm)</span>
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
                        <span>T° (°C)</span>
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
                        <span>TRC (seg)</span>
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
                        <span>Mucosas</span>
                      </label>
                      <select
                        className="form-control text-sm bg-white"
                        value={formData.mucosalState}
                        onChange={(e) => setFormData({ ...formData, mucosalState: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        {MUCOSAL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                      <span>Peso Corporal (kg)</span>
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
                      <span>Condición Corporal (Escala 1 al 9)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" step="0.5" min="1" max="9"
                        className={`form-control w-full text-sm ${clientErrors.bodyConditionScore ? 'border-red-500' : ''}`}
                        placeholder="1 (emaciado) - 5 (ideal) - 9 (obeso)"
                        value={formData.bodyConditionScore}
                        onChange={(e) => setFormData({ ...formData, bodyConditionScore: e.target.value })}
                      />
                      {formData.bodyConditionScore && (
                        <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md whitespace-nowrap">
                          {Number(formData.bodyConditionScore) <= 2
                            ? 'Delgado'
                            : Number(formData.bodyConditionScore) <= 5
                            ? 'Ideal'
                            : Number(formData.bodyConditionScore) <= 7
                            ? 'Sobrepeso'
                            : 'Obesidad'}
                        </span>
                      )}
                    </div>
                    {clientErrors.bodyConditionScore && <p className="text-xs text-red-600 mt-1">{clientErrors.bodyConditionScore}</p>}
                  </div>
                </div>

                {/* Section 5: Observations */}
                <div className="form-group mb-0">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Observaciones Adicionales (Opcional)
                  </label>
                  <textarea
                    className="form-control w-full text-sm"
                    rows={2}
                    placeholder="Otras notas relevantes, indicaciones al dueño, fecha de control sugerida..."
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
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white transition inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    disabled={saving}
                  >
                    <Save size={18} />
                    <span>{saving ? 'Guardando...' : editingRecord ? 'Actualizar Registro' : 'Guardar Registro'}</span>
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
                title="No hay registros médicos"
                subtitle="Este animal no cuenta con atenciones clínicas registradas."
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
                            {new Date(record.date).toLocaleDateString('es-ES', {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            })}
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
                        {/* HU9T1 — Edit button only for veterinarian */}
                        {canAddHistory && (
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer"
                            title="Editar registro clínico"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Diagnosis & treatment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Diagnóstico</h4>
                        <p className="text-sm text-gray-800">{record.diagnosis}</p>
                      </div>
                      <div className="bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Tratamiento</h4>
                        <p className="text-sm text-gray-800">{record.treatment}</p>
                      </div>
                    </div>

                    {/* Evolution */}
                    {record.evolution && (
                      <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
                          <Activity size={14} className="text-emerald-700" />
                          <span>Evolución Clínica</span>
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
                              <span>Peso: <strong>{record.weight} kg</strong></span>
                            </div>
                          )}
                          {record.bodyConditionScore != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold">
                              <Activity size={14} className="text-blue-600" />
                              <span>CC: <strong>{record.bodyConditionScore}/9</strong></span>
                            </div>
                          )}
                          {heartRate != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-medium">
                              <HeartPulse size={14} className="text-rose-600" />
                              <span>FC: <strong>{heartRate} lpm</strong></span>
                            </div>
                          )}
                          {respiratoryRate != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-medium">
                              <Wind size={14} className="text-sky-600" />
                              <span>FR: <strong>{respiratoryRate} rpm</strong></span>
                            </div>
                          )}
                          {temperature != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium">
                              <Thermometer size={14} className="text-amber-600" />
                              <span>T°: <strong>{temperature} °C</strong></span>
                            </div>
                          )}
                          {capillaryRefillTime != null && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-medium">
                              <Clock size={14} className="text-indigo-600" />
                              <span>TRC: <strong>{capillaryRefillTime} s</strong></span>
                            </div>
                          )}
                          {mucosalState && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-medium capitalize">
                              <Eye size={14} className="text-purple-600" />
                              <span>Mucosas: <strong>{mucosalState}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Observations */}
                    {record.observations && (
                      <div className="pt-2 border-t border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Observaciones</h4>
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

      {/* ── Tab: Vacunas (HU9T4) ─────────────────────────────────────────────── */}
      {activeTab === 'vacunas' && (
        <div className="space-y-4">
          {tabLoading ? (
            <TabLoadingState />
          ) : tabError ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{tabError}</span>
            </div>
          ) : vaccines.length === 0 ? (
            <EmptyState
              icon={<Syringe size={48} />}
              title="Sin registros de vacunación"
              subtitle="Este animal no tiene vacunas registradas en el sistema."
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
                          Aplicada el{' '}
                          {new Date(vax.applicationDate).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {vax.nextDoseDate && (
                      <div className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                        <Calendar size={13} />
                        <span>
                          Próxima dosis:{' '}
                          {new Date(vax.nextDoseDate).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {vax.batchNumber && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        Lote: <strong>{vax.batchNumber}</strong>
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

      {/* ── Tab: Producción (HU9T4) ──────────────────────────────────────────── */}
      {activeTab === 'produccion' && (
        <div className="space-y-4">
          {tabLoading ? (
            <TabLoadingState />
          ) : tabError ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{tabError}</span>
            </div>
          ) : production.length === 0 ? (
            <EmptyState
              icon={<BarChart2 size={48} />}
              title="Sin datos de producción"
              subtitle="No se han registrado datos productivos para este animal."
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
                        {new Date(prod.date).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-gray-900">{prod.quantity}</span>
                    <span className="text-sm text-gray-500">{prod.unit}</span>
                  </div>
                  {prod.purpose && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <ChevronRight size={13} className="text-gray-400" />
                      <span>{prod.purpose}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Reproducción (HU9T4) ────────────────────────────────────────── */}
      {activeTab === 'reproduccion' && (
        <div className="space-y-4">
          {tabLoading ? (
            <TabLoadingState />
          ) : tabError ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{tabError}</span>
            </div>
          ) : reproduction.length === 0 ? (
            <EmptyState
              icon={<Baby size={48} />}
              title="Sin datos reproductivos"
              subtitle="No se han registrado datos de reproducción para este animal."
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
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">Estado reproductivo</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{rep.reproductiveStatus}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">Crías</p>
                      <p className="text-sm font-semibold text-gray-900">{rep.offspringCount}</p>
                    </div>
                    {rep.breedingType && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">Tipo de monta</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{rep.breedingType}</p>
                      </div>
                    )}
                    {rep.lastCalvingDate && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">Último parto</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(rep.lastCalvingDate).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
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
