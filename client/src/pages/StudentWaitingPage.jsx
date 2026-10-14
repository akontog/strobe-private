import React from 'react';
import { useTranslation } from 'react-i18next';

export default function StudentWaitingPage() {
  const { t } = useTranslation('interface');

  return (
    <section className="dashboard-page dashboard-page--entry">
      <div className="dashboard-shell">
        <header className="page-hero page-hero--compact">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt={t('strobeLogo')} />
            <h1>{t('studentWaitingTitle')}</h1>
          </div>
          <p className="page-hero__lead">{t('studentWaitingMessage')}</p>
        </header>
      </div>
    </section>
  );
}
