import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const OPTIONS = [
  { code: 'en', labelKey: 'english', codeLabel: 'en' },
  { code: 'el', labelKey: 'greek', codeLabel: 'el' }
];

export default function LanguageSwitcher({ sessionControl = null }) {
  const { t } = useTranslation('common');
  const activeLanguage = i18n.resolvedLanguage || i18n.language;

  return (
    <div className="locale-controls">
      <div className="language-switcher" aria-label={t('language')}>
        {OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            className={`language-switcher-btn ${activeLanguage?.startsWith(option.code) ? 'active' : ''}`}
            onClick={() => i18n.changeLanguage(option.code)}
            title={t(option.labelKey)}
            aria-label={t(option.labelKey)}
            aria-pressed={activeLanguage?.startsWith(option.code) || false}
          >
            <span>{option.codeLabel}</span>
          </button>
        ))}
      </div>
      {sessionControl}
    </div>
  );
}

