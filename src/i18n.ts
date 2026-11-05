import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esTranslation from './locales/es/translation.json';
import enTranslation from './locales/en/translation.json';

// Detección inicial de idioma: preferencia guardada en localStorage o idioma del navegador
const getInitialLanguage = (): string => {
  const saved = localStorage.getItem('i18nextLng');
  if (saved && (saved === 'es' || saved === 'en')) {
    return saved;
  }
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'en' ? 'en' : 'es';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        translation: esTranslation
      },
      en: {
        translation: enTranslation
      }
    },
    lng: getInitialLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React ya escapa valores contra XSS
    }
  });

i18n.on('languageChanged', (lng: string) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
