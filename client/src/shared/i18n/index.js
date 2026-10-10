import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEl from '../../locales/el/common.json';
import menuEl from '../../locales/el/menu.json';
import geometryEl from '../../locales/el/geometry.json';
import buffonEl from '../../locales/el/buffon.json';
import neuralEl from '../../locales/el/neural.json';
import interfaceEl from '../../locales/el/interface.json';
import primesEl from '../../locales/el/primes.json';
import navigationEl from '../../locales/el/navigation.json';

import commonEn from '../../locales/en/common.json';
import menuEn from '../../locales/en/menu.json';
import geometryEn from '../../locales/en/geometry.json';
import buffonEn from '../../locales/en/buffon.json';
import neuralEn from '../../locales/en/neural.json';
import interfaceEn from '../../locales/en/interface.json';
import primesEn from '../../locales/en/primes.json';
import navigationEn from '../../locales/en/navigation.json';

export const preferredLanguageStorageKey = 'preferredLanguage';

const resources = {
  el: {
    common: commonEl,
    menu: menuEl,
    geometry: geometryEl,
    buffon: buffonEl,
    neural: neuralEl,
    interface: interfaceEl,
    primes: primesEl,
    navigation: navigationEl
  },
  en: {
    common: commonEn,
    menu: menuEn,
    geometry: geometryEn,
    buffon: buffonEn,
    neural: neuralEn,
    interface: interfaceEn,
    primes: primesEn,
    navigation: navigationEn
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
      ns: ['common', 'menu', 'geometry', 'buffon', 'neural', 'interface', 'primes', 'navigation'],
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
  document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'el';

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
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }

  try {
    localStorage.setItem(preferredLanguageStorageKey, language);
  } catch {
    // ignore storage failures in private/incognito contexts
  }
});

export default i18n;
