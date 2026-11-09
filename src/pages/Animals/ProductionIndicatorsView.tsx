import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { productionService } from '../../services/api';
import type { ProductionIndicators, ProductionIndicatorsQuery } from '../../types';
import {
  TrendingUp,
  Scale,
  Droplet,
  Package,
  Calendar,
  Filter,
  Star,
  RefreshCw,
  BarChart3,
  Activity,
  Layers
} from 'lucide-react';
import { formatDateLong } from '../../utils/l10n';

interface ProductionIndicatorsViewProps {
  animalId: string;
}

export const ProductionIndicatorsView: React.FC<ProductionIndicatorsViewProps> = ({ animalId }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Preset default: last 30 days
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState<ProductionIndicatorsQuery>({
    from: thirtyDaysAgoStr,
    to: todayStr,
  });

  const [indicators, setIndicators] = useState<ProductionIndicators | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'30' | '90' | 'all' | 'custom'>('30');

  const fetchIndicators = useCallback(async (query: ProductionIndicatorsQuery) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productionService.getIndicators(animalId, query);
      setIndicators(data);
    } catch (err: unknown) {
      console.error('Error fetching production indicators:', err);
      setError(t('production.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    fetchIndicators(dateRange);
  }, [dateRange, fetchIndicators]);

  const handlePresetChange = (preset: '30' | '90' | 'all') => {
    setActivePreset(preset);
    const to = new Date().toISOString().split('T')[0];
    let from = '';

    if (preset === '30') {
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (preset === '90') {
      from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else {
      // All time
      from = '2000-01-01';
    }

    setDateRange({ from, to });
  };

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePreset('custom');
    fetchIndicators(dateRange);
  };

  const period = indicators?.period;
  const evolution = indicators?.weightGainEvolution ?? [];

  // Calculate highest weight and cumulative gain for visual bars
  const maxCumulativeGain = evolution.length > 0
    ? Math.max(...evolution.map((e) => Math.abs(e.cumulativeWeightGain)), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* ─── Filter Bar ─────────────────────────────────────────────── */}
      <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Filter size={14} className="text-emerald-700" />
              {t('production.indicators.periodFilter')}
            </span>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handlePresetChange('30')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activePreset === '30'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('production.indicators.last30Days')}
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('90')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activePreset === '90'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('production.indicators.last90Days')}
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activePreset === 'all'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('production.indicators.allTime')}
              </button>
            </div>
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleCustomFilterSubmit} className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 font-medium">{t('production.indicators.from')}:</label>
              <input
                type="date"
                value={dateRange.from ?? ''}
                onChange={(e) => {
                  setDateRange({ ...dateRange, from: e.target.value });
                  setActivePreset('custom');
                }}
                className="form-control text-xs py-1 px-2.5 rounded-lg border-gray-200"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 font-medium">{t('production.indicators.to')}:</label>
              <input
                type="date"
                value={dateRange.to ?? ''}
                onChange={(e) => {
                  setDateRange({ ...dateRange, to: e.target.value });
                  setActivePreset('custom');
                }}
                className="form-control text-xs py-1 px-2.5 rounded-lg border-gray-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-1.5 px-3 rounded-lg shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{t('production.indicators.apply')}</span>
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw className="animate-spin text-emerald-600" size={22} />
          <span className="text-sm font-medium">{t('production.loading')}</span>
        </div>
      )}

      {!loading && period && period.totalRecords === 0 && (
        <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
          <BarChart3 size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">{t('production.indicators.noIndicators')}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('production.noRecordsSubtitle')}</p>
        </div>
      )}

      {!loading && period && period.totalRecords > 0 && (
        <>
          {/* ─── Metric Cards Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ganancia de peso acumulada */}
            <div className="card bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-xs border border-purple-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  {t('production.indicators.accumulatedWeightGain')}
                </span>
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-purple-900">
                  {period.totalWeightGain != null ? `+${period.totalWeightGain}` : '0.0'}
                </span>
                <span className="text-sm font-bold text-purple-700">{t('production.display.kg')}</span>
              </div>
              <p className="text-xs text-purple-600/80 mt-1">
                {t('production.indicators.totalRecords')}: {period.totalRecords}
              </p>
            </div>

            {/* Peso promedio */}
            <div className="card bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-xs border border-emerald-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {t('production.indicators.avgWeight')}
                </span>
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Scale size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-950">
                  {period.avgWeight != null ? period.avgWeight : '—'}
                </span>
                <span className="text-sm font-bold text-emerald-700">{t('production.display.kg')}</span>
              </div>
              <p className="text-xs text-emerald-600/80 mt-1">
                {period.totalWeight != null
                  ? `${t('production.indicators.totalWeight')}: ${period.totalWeight} kg`
                  : '—'}
              </p>
            </div>

            {/* Producción de Leche */}
            <div className="card bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-xs border border-blue-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  {t('production.indicators.totalMilk')}
                </span>
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <Droplet size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-950">
                  {period.totalMilkProduction != null ? period.totalMilkProduction : '—'}
                </span>
                <span className="text-sm font-bold text-blue-700">{t('production.display.liters')}</span>
              </div>
              <p className="text-xs text-blue-600/80 mt-1">
                {period.avgMilkProduction != null
                  ? `${t('production.indicators.avgMilk')}: ${period.avgMilkProduction} L`
                  : '—'}
              </p>
            </div>

            {/* Lotes Totales y Período */}
            <div className="card bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-xs border border-amber-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {t('production.indicators.totalRecords')}
                </span>
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Package size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-950">{period.totalRecords}</span>
                <span className="text-sm font-bold text-amber-700">lotes</span>
              </div>
              <p className="text-xs text-amber-600/80 mt-1">
                {period.from.split('T')[0]} → {period.to.split('T')[0]}
              </p>
            </div>
          </div>

          {/* ─── Quality & Purpose Distribution (HU17T5, HU17T6) ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calidad del Producto */}
            <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <Star size={16} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {t('production.indicators.qualityTitle')}
                </h3>
              </div>

              {Object.keys(period.qualityDistribution).length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">{t('production.indicators.unspecified')}</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(period.qualityDistribution).map(([quality, count]) => {
                    const pct = Math.round((count / period.totalRecords) * 100);
                    return (
                      <div key={quality} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                            {quality}
                          </span>
                          <span className="font-bold text-gray-900">
                            {count} lotes <span className="text-gray-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Propósito Productivo */}
            <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Layers size={16} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {t('production.indicators.purposeTitle')}
                </h3>
              </div>

              {Object.keys(period.purposeDistribution).length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">{t('production.indicators.unspecified')}</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(period.purposeDistribution).map(([purpose, count]) => {
                    const pct = Math.round((count / period.totalRecords) * 100);
                    return (
                      <div key={purpose} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700 capitalize flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            {t(`production.purpose.${purpose}`, { defaultValue: purpose })}
                          </span>
                          <span className="font-bold text-gray-900">
                            {count} lotes <span className="text-gray-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── Weight Gain Evolution (HU17T4, HU17T6) ───────────────────── */}
          <div className="card bg-white rounded-xl shadow-xs border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {t('production.indicators.evolutionTitle')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {t('production.indicators.evolutionSubtitle')}
                  </p>
                </div>
              </div>

              {/* Legends */}
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
                  {t('production.indicators.chartCumulative')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  {t('production.indicators.chartWeight')}
                </span>
              </div>
            </div>

            {evolution.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                {t('production.indicators.noEvolutionData')}
              </p>
            ) : (
              <div className="space-y-4">
                {/* Visual Chart Bars per Record */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {evolution.map((item, idx) => {
                    const gainPct = maxCumulativeGain > 0
                      ? Math.min(Math.round((item.cumulativeWeightGain / maxCumulativeGain) * 100), 100)
                      : 0;

                    return (
                      <div
                        key={idx}
                        className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 hover:border-purple-200 transition space-y-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <Calendar size={13} className="text-purple-600" />
                            {formatDateLong(item.date, lang)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            +{item.cumulativeWeightGain} kg acum.
                          </span>
                        </div>

                        {/* Visual bar of cumulative progress */}
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                            style={{ width: `${Math.max(gainPct, 6)}%` }}
                          />
                        </div>

                        {/* Detailed Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                          <div>
                            <span className="text-gray-400 block text-[11px] uppercase tracking-wider">
                              {t('production.indicators.chartGain')}
                            </span>
                            <span className="font-bold text-emerald-700">
                              {item.weightGain != null ? `+${item.weightGain} kg` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[11px] uppercase tracking-wider">
                              {t('production.indicators.chartWeight')}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {item.weight != null ? `${item.weight} kg` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
