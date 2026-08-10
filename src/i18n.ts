import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import mrTranslation from './locales/mr.json';

const resources = {
  en: {
    translation: enTranslation
  },
  mr: {
    translation: mrTranslation
  }
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('appLanguage') || 'en' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // saved or default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
