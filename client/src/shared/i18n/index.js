import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEl from './locales/el/common.json';
import menuEl from './locales/el/menu.json';
import geometryEl from './locales/el/geometry.json';
import buffonEl from './locales/el/buffon.json';
import fourierEl from './locales/el/fourier.json';
import neuralEl from './locales/el/neural.json';

import commonEn from './locales/en/common.json';
import menuEn from './locales/en/menu.json';
import geometryEn from './locales/en/geometry.json';
import buffonEn from './locales/en/buffon.json';
import fourierEn from './locales/en/fourier.json';
import neuralEn from './locales/en/neural.json';

export const preferredLanguageStorageKey = 'preferredLanguage';

const resources = {
  el: {
    common: commonEl,
    menu: menuEl,
    geometry: geometryEl,
    buffon: buffonEl,
    fourier: fourierEl,
    neural: neuralEl
  },
  en: {
    common: commonEn,
    menu: menuEn,
    geometry: geometryEn,
    buffon: buffonEn,
    fourier: fourierEn,
    neural: neuralEn
  }
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'el',
      supportedLngs: ['el', 'en'],
      defaultNS: 'common',
      ns: ['common', 'menu', 'geometry', 'buffon', 'fourier', 'neural'],
      interpolation: {
        escapeValue: false
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: preferredLanguageStorageKey,
        caches: ['localStorage']
      }
    });
}

if (typeof window !== 'undefined') {
  window.StrobeI18n = i18n;

  const storedLanguage = (() => {
    try {
      return localStorage.getItem(preferredLanguageStorageKey);
    } catch {
      return null;
    }
  })();

  if (storedLanguage && storedLanguage !== i18n.language) {
    i18n.changeLanguage(storedLanguage);
  }
}

i18n.on('languageChanged', (language) => {
  try {
    localStorage.setItem(preferredLanguageStorageKey, language);
  } catch {
    // ignore storage failures in private/incognito contexts
  }
});

export default i18n;
