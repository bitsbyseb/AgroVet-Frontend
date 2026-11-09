import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { animalService, authService } from '../../services/api';
import type { Animal, ProductionRecord, ProductionInput } from '../../types';
import { ArrowLeft, Plus, Save, X, Calendar, Package, Droplet, Scale, TrendingUp, Star, BarChart3, List } from 'lucide-react';
import { ProductionIndicatorsView } from './ProductionIndicatorsView';
import { formatDateLong, formatQuantity } from '../../utils/l10n';

const AnimalProduction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const currentUser = authService.getCurrentUser();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'records' | 'indicators'>('records');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductionInput>({
    date: new Date().toISOString().split('T')[0],
    type: 'Leche',
    quantity: 0,
    unit: 'Litros',
    purpose: 'milk',
    productionDate: null,
    weightGain: null,
    productQuality: null,
  });

  // Only Zootechnician can add production records
  const canAddProduction = currentUser?.role === 'zootechnician';

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalData, productionData] = await Promise.all([
        animalService.getById(id!),
        animalService.getProduction(id!),
      ]);
      setAnimal(animalData);
      setProduction(productionData);
    } catch (err) {
      console.error('Error fetching production:', err);
      setError(t('production.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Leche',
      quantity: 0,
      unit: 'Litros',
      purpose: 'milk',
      productionDate: null,
      weightGain: null,
      productQuality: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;

    const submissionData: ProductionInput = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      quantity: Number(formData.quantity),
      productionDate: formData.productionDate || null,
      weightGain: formData.weightGain != null ? Number(formData.weightGain) : null,
      productQuality: formData.productQuality?.trim() || null,
    };

    setSaving(true);
    try {
      await animalService.addProduction(id, submissionData);
      setShowAddForm(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          t('production.errors.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Package className="animate-pulse text-emerald-600" size={20} />
        <span>{t('production.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/animals')}
          className="btn bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="text-emerald-700" size={28} />
            <span>
              {t('production.titleWithName', { name: animal?.name })}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {t(`animals.gender.${animal?.gender}`)}
          </p>
        </div>

        {canAddProduction && !showAddForm && (
          <button
            onClick={() => {
              setActiveTab('records');
              setShowAddForm(true);
            }}
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>{t('production.newRecord')}</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'records'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <List size={18} />
          <span>{t('production.indicators.tabRecords')}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
            {production.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('indicators')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'indicators'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 size={18} />
          <span>{t('production.indicators.tabIndicators')}</span>
        </button>
      </div>

      {activeTab === 'indicators' ? (
        <ProductionIndicatorsView animalId={id!} />
      ) : (
        <>
          {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="card bg-white rounded-xl shadow-md border border-emerald-200 p-6">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-emerald-700" />
              <span>{t('production.addRecord')}</span>
            </h2>
            <button
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha de Registro */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="form-control w-full text-sm"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* Fecha de Producción (HU16) */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.productionDate')}
                </label>
                <input
                  type="date"
                  className="form-control w-full text-sm"
                  value={formData.productionDate ?? ''}
                  onChange={(e) => setFormData({ ...formData, productionDate: e.target.value || null })}
                />
              </div>

              {/* Tipo de Producto */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.type')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="form-control w-full text-sm"
                  placeholder={t('production.fields.typePlaceholder')}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                />
              </div>

              {/* Cantidad */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.quantity')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control w-full text-sm"
                  placeholder={t('production.fields.quantityPlaceholder')}
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                />
              </div>

              {/* Unidad de Medida */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.unit')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="form-control w-full text-sm"
                  placeholder={t('production.fields.unitPlaceholder')}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>

              {/* Ganancia de Peso (HU16) */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.weightGain')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control w-full text-sm"
                  placeholder={t('production.fields.weightGainPlaceholder')}
                  value={formData.weightGain ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, weightGain: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>

              {/* Propósito */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.purpose')} <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-control w-full text-sm"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                >
                  <option value="milk">{t('production.purpose.milk')}</option>
                  <option value="meat">{t('production.purpose.meat')}</option>
                  <option value="eggs">{t('production.purpose.eggs')}</option>
                  <option value="wool">{t('production.purpose.wool')}</option>
                  <option value="dual">{t('production.purpose.dual')}</option>
                  <option value="other">{t('production.purpose.other')}</option>
                </select>
              </div>

              {/* Calidad del Producto (HU16) */}
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('production.fields.productQuality')}
                </label>
                <input
                  type="text"
                  className="form-control w-full text-sm"
                  placeholder={t('production.fields.productQualityPlaceholder')}
                  value={formData.productQuality ?? ''}
                  onChange={(e) => setFormData({ ...formData, productQuality: e.target.value || null })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); resetForm(); }}
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
                <span>{saving ? t('common.saving') : t('production.saveRecord')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {production.length === 0 ? (
          <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">{t('production.noRecords')}</h3>
            <p className="text-xs text-gray-500 mt-1">{t('production.noRecordsSubtitle')}</p>
          </div>
        ) : (
          production.map((record) => (
            <div
              key={record.id}
              className="card bg-white rounded-xl shadow-xs border-l-4 border-l-emerald-600 border border-gray-100 p-5"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{record.type}</h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {formatDateLong(record.date, lang)}
                    </p>
                  </div>
                </div>
                {/* Badges de calidad y propósito */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {record.productQuality && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Star size={12} />
                      {record.productQuality}
                    </span>
                  )}
                  {record.purpose && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {t(`production.purpose.${record.purpose}`, { defaultValue: record.purpose })}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                {/* Cantidad */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {t('production.display.quantity')}
                    </h4>
                    <p className="text-lg font-bold text-emerald-700">
                      {formatQuantity(record.quantity, record.unit, lang)}
                    </p>
                  </div>
                </div>

                {/* Tipo */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
                    <Droplet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {t('production.display.typeAndPurpose')}
                    </h4>
                    <p className="text-base font-semibold text-gray-800">{record.type}</p>
                  </div>
                </div>

                {/* Fecha de Producción (HU16) */}
                {record.productionDate && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100/70 text-blue-800 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t('production.display.productionDate')}
                      </h4>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatDateLong(record.productionDate, lang)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Ganancia de Peso (HU16) */}
                {record.weightGain != null && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100/70 text-purple-800 rounded-lg flex items-center justify-center shrink-0">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t('production.display.weightGain')}
                      </h4>
                      <p className="text-base font-bold text-purple-700">
                        +{record.weightGain} {t('production.display.kg')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default AnimalProduction;
