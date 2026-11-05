/**
 * l10n.ts — Funciones de Localización (l10n) para AgroVet
 *
 * Utiliza las APIs nativas Intl.DateTimeFormat e Intl.NumberFormat para
 * formatear fechas, pesos (kg) y volúmenes (litros) según el locale activo.
 *
 * Uso:
 *   import { formatDate, formatWeight, formatVolume } from '@/utils/l10n';
 *   const { i18n } = useTranslation();
 *   formatDate('2026-05-10', i18n.language);          // "10 de mayo de 2026"
 *   formatWeight(24.5, i18n.language);                 // "24,5 kg"
 *   formatVolume(15.3, i18n.language);                 // "15,3 L"
 */

// ─── Mapeo de código i18next → locale BCP 47 ─────────────────────────────────
const LOCALE_MAP: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
};

function resolveLocale(lang: string): string {
  return LOCALE_MAP[lang] ?? lang;
}

// ─── Formateo de Fechas ───────────────────────────────────────────────────────

/**
 * Formatea una fecha con opciones de Intl.DateTimeFormat.
 * @param date  Fecha: string ISO, número (epoch ms) o Date
 * @param lang  Código de idioma activo del i18next (ej. 'es', 'en')
 * @param opts  Opciones de Intl.DateTimeFormat (por defecto: fecha completa legible)
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  lang: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';

  const defaultOpts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(resolveLocale(lang), opts ?? defaultOpts).format(d);
}

/**
 * Formatea una fecha con día de la semana completo.
 * Ej: "lunes, 10 de mayo de 2026"
 */
export function formatDateLong(
  date: string | number | Date | null | undefined,
  lang: string,
): string {
  return formatDate(date, lang, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatea una fecha en versión corta.
 * Ej: "10 may. 2026"
 */
export function formatDateShort(
  date: string | number | Date | null | undefined,
  lang: string,
): string {
  return formatDate(date, lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formatea una fecha en versión con día de semana corto.
 * Ej: "lun., 10 may. 2026"
 */
export function formatDateWithWeekday(
  date: string | number | Date | null | undefined,
  lang: string,
): string {
  return formatDate(date, lang, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Formateo de Números ──────────────────────────────────────────────────────

/**
 * Formatea un número genérico con separador decimal localizado.
 * @param value   Valor numérico
 * @param lang    Código de idioma
 * @param opts    Opciones de Intl.NumberFormat
 */
export function formatNumber(
  value: number | null | undefined,
  lang: string,
  opts?: Intl.NumberFormatOptions,
): string {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat(resolveLocale(lang), opts).format(value);
}

/**
 * Formatea un peso en kilogramos.
 * Ej (es-CO): "24,5 kg" | (en-US): "24.5 kg"
 */
export function formatWeight(
  kg: number | null | undefined,
  lang: string,
): string {
  if (kg == null || isNaN(kg)) return '—';
  return (
    new Intl.NumberFormat(resolveLocale(lang), {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(kg) + ' kg'
  );
}

/**
 * Formatea un volumen en litros.
 * Ej (es-CO): "15,3 L" | (en-US): "15.3 L"
 */
export function formatVolume(
  liters: number | null | undefined,
  lang: string,
): string {
  if (liters == null || isNaN(liters)) return '—';
  return (
    new Intl.NumberFormat(resolveLocale(lang), {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(liters) + ' L'
  );
}

/**
 * Formatea una cantidad genérica con su unidad.
 * Ej: formatQuantity(15.3, 'Litros', 'es') → "15,3 Litros"
 */
export function formatQuantity(
  value: number | null | undefined,
  unit: string,
  lang: string,
): string {
  if (value == null || isNaN(value)) return `— ${unit}`;
  return (
    new Intl.NumberFormat(resolveLocale(lang), {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value) +
    ' ' +
    unit
  );
}

/**
 * Formatea temperatura en °C.
 * Ej: "38,5 °C"
 */
export function formatTemperature(
  celsius: number | null | undefined,
  lang: string,
): string {
  if (celsius == null || isNaN(celsius)) return '—';
  return (
    new Intl.NumberFormat(resolveLocale(lang), {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(celsius) + ' °C'
  );
}
