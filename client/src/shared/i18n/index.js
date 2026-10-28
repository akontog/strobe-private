import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEl from '../../locales/el/common.json';
import menuEl from '../../locales/el/menu.json';
import geometryEl from '../../locales/el/geometry.json';
import interfaceEl from '../../locales/el/interface.json';
import navigationEl from '../../locales/el/navigation.json';
import instructionsEl from '../../locales/el/instructions.json';

import commonEn from '../../locales/en/common.json';
import menuEn from '../../locales/en/menu.json';
import geometryEn from '../../locales/en/geometry.json';
import interfaceEn from '../../locales/en/interface.json';
import navigationEn from '../../locales/en/navigation.json';
import instructionsEn from '../../locales/en/instructions.json';

export const preferredLanguageStorageKey = 'preferredLanguage';

const resources = {
  el: {
    common: commonEl,
    menu: menuEl,
    geometry: geometryEl,
    interface: interfaceEl,
    navigation: navigationEl,
    instructions: instructionsEl
  },
  en: {
    common: commonEn,
    menu: menuEn,
    geometry: geometryEn,
    interface: interfaceEn,
    navigation: navigationEn,
    instructions: instructionsEn
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
      ns: ['common', 'menu', 'geometry', 'interface', 'navigation', 'instructions'],
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
