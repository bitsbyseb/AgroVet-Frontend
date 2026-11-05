import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { animalService, authService } from '../../services/api';
import type { Animal, ReproductionRecord, ReproductionInput } from '../../types';
import { ArrowLeft, Plus, Save, X, Activity, Heart } from 'lucide-react';
import { formatDateShort } from '../../utils/l10n';

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

  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ReproductionInput>({
    reproductiveStatus: 'pregnant',
    lastCalvingDate: '',
    offspringCount: 0,
    breedingType: 'natural',
  });

  // Only Zootechnician can add reproduction records
  const canAddReproduction = currentUser?.role === 'zootechnician';

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;

    const submissionData: ReproductionInput & { lastCalvingDate?: string } = {
      ...formData,
      offspringCount: Number(formData.offspringCount),
    };
    if (formData.lastCalvingDate) {
      submissionData.lastCalvingDate = new Date(formData.lastCalvingDate).toISOString();
    } else {
      delete submissionData.lastCalvingDate;
    }

    setSaving(true);
    try {
      await animalService.addReproduction(id, submissionData);
      setShowAddForm(false);
      setFormData({
        reproductiveStatus: 'pregnant',
        lastCalvingDate: '',
        offspringCount: 0,
        breedingType: 'natural',
      });
      fetchData();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          t('reproduction.errors.saveFailed'),
      );
    } finally {
      setSaving(false);
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
            <Heart className="text-pink-600" size={28} />
            <span>
              {t('reproduction.titleWithName', { name: animal?.name })}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {t(`animals.gender.${animal?.gender}`)}
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
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="card bg-white rounded-xl shadow-md border border-pink-200 p-6">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Heart size={20} className="text-pink-600" />
              <span>{t('reproduction.addEvent')}</span>
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                >
                  <option value="natural">{t('reproduction.breedingType.natural')}</option>
                  <option value="artificial">{t('reproduction.breedingType.artificial')}</option>
                  <option value="embryo_transfer">{t('reproduction.breedingType.embryo_transfer')}</option>
                </select>
              </div>

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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('reproduction.fields.offspringCount')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-control w-full text-sm"
                  value={formData.offspringCount}
                  onChange={(e) => setFormData({ ...formData, offspringCount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

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

      <div className="space-y-4">
        {reproduction.length === 0 ? (
          <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
            <Activity size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">{t('reproduction.noRecords')}</h3>
            <p className="text-xs text-gray-500 mt-1">{t('reproduction.noRecordsSubtitle')}</p>
          </div>
        ) : (
          reproduction.map((record) => (
            <div
              key={record.id}
              className="card bg-white rounded-xl shadow-xs border-l-4 border-l-pink-500 border border-gray-100 p-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shrink-0">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {t('reproduction.display.statusLabel', {
                        value: t(`reproduction.status.${record.reproductiveStatus}`, {
                          defaultValue: record.reproductiveStatus,
                        }),
                      })}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('reproduction.display.offspringLabel', {
                        count: record.offspringCount,
                        type: record.breedingType
                          ? t(`reproduction.breedingType.${record.breedingType}`, { defaultValue: record.breedingType })
                          : 'N/A',
                      })}
                    </p>
                    {record.lastCalvingDate && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t('reproduction.display.lastCalving')}:{' '}
                        {formatDateShort(record.lastCalvingDate, lang)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnimalReproduction;
