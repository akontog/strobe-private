import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const OPTIONS = [
  { code: 'el', icon: '🇬🇷', labelKey: 'common.greek' },
  { code: 'en', icon: '🇬🇧', labelKey: 'common.english' }
];

export default function LanguageSwitcher() {
  const { t } = useTranslation();

  return (
    <div className="language-switcher" aria-label={t('common.language')}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={`language-switcher-btn ${i18n.language === option.code ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage(option.code)}
        >
          <span>{option.icon}</span>
          <span>{t(option.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
